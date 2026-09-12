import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Block =
  | { type: "heading"; level: HeadingLevel; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "code"; language?: string; code: string }
  | { type: "math"; text: string };

/**
 * Normalize Gemini markdown quirks before parsing so markers render instead of
 * showing as raw #### / ** / $$ in the chat UI.
 */
function normalizeShepherdMarkdown(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");

  // ####Title -> #### Title
  text = text.replace(/^(#{1,6})([^\s#\n])/gm, "$1 $2");

  // Convert Setext-style underlines to ATX when present
  text = text.replace(/^(.+)\n={3,}\s*$/gm, "## $1");
  text = text.replace(/^(.+)\n-{3,}\s*$/gm, "### $1");

  // Drop orphan heading-marker-only lines (e.g. "####")
  text = text.replace(/^#{1,6}\s*$/gm, "");

  // Soft-unwrap unfinished trailing openers while streaming (avoid raw **)
  text = text.replace(/(\*\*|__|~~|`)+\s*$/g, "");

  // Unfinished $$ opener at EOF: strip the opener so it doesn't paint as raw $$
  if (/\$\$[^]*$/.test(text) && (text.match(/\$\$/g) ?? []).length % 2 === 1) {
    text = text.replace(/\$\$([^]*)$/, "$1");
  }

  // Collapse accidental double blank lines from stripped markers
  text = text.replace(/\n{3,}/g, "\n\n");

  return text;
}

/**
 * Inline markdown: bold, italic, code, links, strikethrough, inline math.
 */
function inlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`\n]+`|\*\*((?:[^*]|\*(?!\*))+?)\*\*|__((?:[^_]|_(?!_))+?)__|~~([^~\n]+?)~~|\*((?:[^*\n]|\*(?!\*))+?)\*|_((?:[^_\n]|_(?!_))+?)_|\[([^\]]+)\]\(([^)]+)\)|\$([^$\n]+)\$)/g;

  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(stripResidualMarkers(text.slice(last, match.index)));
    }

    const token = match[0];

    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {inlineMarkdown(match[2])}
        </strong>
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {inlineMarkdown(match[3])}
        </strong>
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <span key={key++} className="line-through text-muted-foreground">
          {match[4]}
        </span>
      );
    } else if (match[5] !== undefined) {
      nodes.push(
        <em key={key++} className="italic">
          {inlineMarkdown(match[5])}
        </em>
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <em key={key++} className="italic">
          {inlineMarkdown(match[6])}
        </em>
      );
    } else if (match[7] !== undefined && match[8] !== undefined) {
      const href = match[8];
      const isSafe =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:");
      if (isSafe) {
        nodes.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            {match[7]}
          </a>
        );
      } else {
        nodes.push(match[7]);
      }
    } else if (match[9] !== undefined) {
      nodes.push(
        <span
          key={key++}
          className="rounded bg-muted/70 px-1 font-mono text-[0.9em]"
        >
          {match[9]}
        </span>
      );
    } else {
      nodes.push(stripResidualMarkers(token));
    }

    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(stripResidualMarkers(text.slice(last)));
  }

  return nodes.length ? nodes : [stripResidualMarkers(text)];
}

/** Remove leftover raw markers that never formed a complete token. */
function stripResidualMarkers(text: string): string {
  return text
    .replace(/(^|\s)#{1,6}(?=\s|$)/g, "$1")
    .replace(/\${2}/g, "")
    .replace(/(^|\s)\*\*(?=\s|$)/g, "$1")
    .replace(/(^|\s)__(?=\s|$)/g, "$1");
}

function headingTag(level: HeadingLevel): "h3" | "h4" | "h5" | "h6" {
  if (level <= 1) return "h3";
  if (level === 2) return "h4";
  if (level === 3) return "h5";
  return "h6";
}

function headingClass(level: HeadingLevel): string {
  if (level <= 1) return "text-base sm:text-lg";
  if (level === 2) return "text-[0.95rem] sm:text-base";
  if (level === 3) return "text-sm sm:text-[0.95rem]";
  return "text-sm";
}

function isBlockBoundary(trimmed: string): boolean {
  return (
    !trimmed ||
    /^(#{1,6})\s+\S/.test(trimmed) ||
    /^[-*•]\s+\S/.test(trimmed) ||
    /^\d+[.)]\s+\S/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed) ||
    /^```/.test(trimmed) ||
    /^\$\$/.test(trimmed)
  );
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i += 1;
      let closed = false;
      while (i < lines.length) {
        const codeLine = lines[i] ?? "";
        if (codeLine.trim().startsWith("```")) {
          closed = true;
          i += 1;
          break;
        }
        codeLines.push(codeLine);
        i += 1;
      }
      // Incomplete fence while streaming — still show as code, not raw ```
      blocks.push({
        type: "code",
        language: closed ? language : language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    if (trimmed.startsWith("$$")) {
      if (trimmed.endsWith("$$") && trimmed.length > 4) {
        blocks.push({ type: "math", text: trimmed.slice(2, -2).trim() });
        i += 1;
        continue;
      }

      const mathLines: string[] = [];
      const first = trimmed.slice(2);
      if (first) mathLines.push(first);
      i += 1;
      let closed = false;
      while (i < lines.length) {
        const mathLine = lines[i] ?? "";
        const mathTrimmed = mathLine.trim();
        if (mathTrimmed.endsWith("$$")) {
          const body = mathTrimmed.slice(0, -2).trim();
          if (body) mathLines.push(body);
          closed = true;
          i += 1;
          break;
        }
        mathLines.push(mathLine);
        i += 1;
      }
      const mathText = mathLines.join("\n").trim();
      if (mathText) {
        blocks.push({ type: "math", text: mathText });
      } else if (!closed) {
        // bare $$ — skip
      }
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)(?:\s+#*)?$/.exec(trimmed);
    if (heading) {
      const level = Math.min(6, heading[1]!.length) as HeadingLevel;
      const headingText = heading[2]!.trim();
      if (headingText) {
        blocks.push({ type: "heading", level, text: headingText });
      }
      i += 1;
      continue;
    }

    if (/^#{1,6}$/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? "").trim();
        if (!/^>\s?/.test(itemLine)) break;
        quoteLines.push(itemLine.replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^[-*•]\s+\S/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? "").trim();
        if (!/^[-*•]\s+\S/.test(itemLine)) break;
        items.push(itemLine.replace(/^[-*•]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+[.)]\s+\S/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? "").trim();
        if (!/^\d+[.)]\s+\S/.test(itemLine)) break;
        items.push(itemLine.replace(/^\d+[.)]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (isBlockBoundary(next)) break;
      paragraph.push(next);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

export function ShepherdMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const normalized = normalizeShepherdMarkdown(content);
  const blocks = parseBlocks(normalized);

  if (!blocks.length && normalized) {
    return (
      <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)}>
        {inlineMarkdown(normalized)}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed text-foreground",
        className
      )}
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = headingTag(block.level);
          return (
            <Tag
              key={index}
              className={cn(
                "font-heading font-semibold tracking-tight text-foreground",
                headingClass(block.level)
              )}
            >
              {inlineMarkdown(block.text)}
            </Tag>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-primary/40 pl-3 text-muted-foreground"
            >
              {inlineMarkdown(block.text)}
            </blockquote>
          );
        }

        if (block.type === "hr") {
          return <hr key={index} className="border-border/70" />;
        }

        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-[0.8rem] leading-relaxed"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === "math") {
          return (
            <div
              key={index}
              className="overflow-x-auto rounded-lg border border-border/50 bg-muted/30 px-3 py-2 font-mono text-[0.85rem] leading-relaxed text-foreground"
            >
              {block.text}
            </div>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-1.5 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{inlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}
