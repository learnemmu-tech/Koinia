import type { ShortCategory } from "@/types/video-short";

export type ParsedShortCaption = {
  title: string;
  description: string;
  topic: string;
};

/**
 * Shorts store title, description, and a custom topic inside a single `caption`
 * column (see create-short-sheet `buildCaption`). This reads that structure back
 * for display without changing the database.
 *
 * Format written by the composer:
 *   "Title\n\nDescription\n\n— Custom topic"
 */
export function parseShortCaption(
  caption: string,
  category?: ShortCategory | string | null
): ParsedShortCaption {
  const blocks = caption
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let topic = "";
  if (blocks.length > 1) {
    const last = blocks[blocks.length - 1]!;
    const custom = last.match(/^[—–-]\s*(.+)$/);
    if (custom?.[1]) {
      topic = custom[1].trim();
      blocks.pop();
    }
  }

  const title = blocks.shift() ?? "";
  const description = blocks.join("\n\n");

  if (!topic && category) {
    topic = String(category);
  }

  return { title, description, topic };
}
