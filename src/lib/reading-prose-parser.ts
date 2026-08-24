export type ReadingBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "reference"; text: string }
  | { type: "p"; text: string; verseNumber?: string };

const SMALL_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "with",
  "to",
  "for",
  "on",
  "at",
  "by",
  "from",
  "as",
  "is",
  "his",
  "her",
  "their",
  "our",
  "your",
  "its",
]);

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isScriptureReference(text: string): boolean {
  return /^(?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?\s+\d+:\d+(?:-\d+)?(?:-\d+)?$/.test(
    text.trim(),
  );
}

function isSectionHeading(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  if (/^[#>\-*]/.test(trimmed)) return false;
  if (isScriptureReference(trimmed)) return false;
  if (/[.!?,;:]$/.test(trimmed)) return false;
  if (/\d:\d/.test(trimmed)) return false;
  if (/^\d/.test(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 10) return false;

  let titleLike = 0;
  for (const word of words) {
    const core = word.replace(/^[^A-Za-z'"]+|[^A-Za-z'"]+$/g, "");
    if (!core) continue;
    if (SMALL_WORDS.has(core.toLowerCase())) continue;
    if (/^[A-Z]/.test(core) || /^['"]/.test(word)) {
      titleLike++;
      continue;
    }
    return false;
  }

  return titleLike >= 1;
}

export function extractVersePrefix(line: string): {
  verseNumber?: string;
  text: string;
} {
  const trimmed = line.trim();
  if (!trimmed) return { text: "" };

  const spaced = trimmed.match(/^(\d{1,3})\s+(.+)$/);
  if (spaced && /[A-Za-z"'([]/.test(spaced[2]!)) {
    return { verseNumber: spaced[1], text: spaced[2]!.trim() };
  }

  const attached = trimmed.match(/^(\d{1,3})([A-Z].*)$/);
  if (attached) {
    return { verseNumber: attached[1], text: attached[2]!.trim() };
  }

  return { text: trimmed };
}

function splitLongParagraph(text: string): string[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const byVerseBoundary = normalized.split(
    /(?<=[.!?…])\s+(?=\d{1,3}(?:\s+|[A-Z]))/,
  );
  const chunks =
    byVerseBoundary.length > 1 ? byVerseBoundary : [normalized];

  const result: string[] = [];

  for (const chunk of chunks) {
    if (chunk.length <= 360) {
      result.push(chunk);
      continue;
    }

    const sentences = chunk
      .split(/(?<=[.!?…])\s+(?=[A-Z"'([])/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      result.push(chunk);
      continue;
    }

    let current = "";
    for (const sentence of sentences) {
      if (current && current.length + sentence.length + 1 > 360) {
        result.push(current.trim());
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }

    if (current.trim()) {
      result.push(current.trim());
    }
  }

  return result.length > 0 ? result : [normalized];
}

function pushParagraphBlocks(blocks: ReadingBlock[], text: string) {
  for (const part of splitLongParagraph(text)) {
    const { verseNumber, text: body } = extractVersePrefix(part);
    if (!body) continue;
    blocks.push({ type: "p", text: body, verseNumber });
  }
}

export function parseReadingContent(content: string): ReadingBlock[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const lines = trimmed.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReadingBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const joined = normalizeWhitespace(paragraphLines.join(" "));
    paragraphLines = [];
    if (joined) {
      pushParagraphBlocks(blocks, joined);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "h2", text: line.slice(2).trim() });
      continue;
    }

    if (isScriptureReference(line)) {
      flushParagraph();
      blocks.push({ type: "reference", text: line });
      continue;
    }

    if (isSectionHeading(line)) {
      flushParagraph();
      blocks.push({ type: "h2", text: line });
      continue;
    }

    const { verseNumber, text } = extractVersePrefix(line);
    if (verseNumber) {
      flushParagraph();
      blocks.push({ type: "p", text, verseNumber });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();

  if (blocks.length === 0 && trimmed) {
    pushParagraphBlocks(blocks, trimmed);
  }

  return blocks;
}
