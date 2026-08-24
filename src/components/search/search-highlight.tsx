"use client";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type HighlightedTextProps = {
  text: string;
  query: string;
  className?: string;
};

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-primary/20 px-0.5 font-semibold text-foreground"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
