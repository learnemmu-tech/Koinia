import { SHORT_CATEGORIES, type ShortCategory } from "@/types/video-short";

export type ParsedShortCaption = {
  title: string;
  description: string;
  topic: string;
};

function isKnownCategory(topic: string): boolean {
  return SHORT_CATEGORIES.some(
    (item) => item.toLowerCase() === topic.toLowerCase()
  );
}

export function resolveShortCategory(topic: string): ShortCategory {
  const trimmed = topic.trim();
  if (!trimmed) return "Other";
  const match = SHORT_CATEGORIES.find(
    (item) => item.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? "Other";
}

/** Maps Title + Description (+ custom topic) into the existing caption API field. */
export function buildShortCaption(
  title: string,
  description: string,
  topic: string
): string {
  const titleText = title.trim();
  const descriptionText = description.trim();
  const topicText = topic.trim();
  const parts: string[] = [];

  if (titleText) parts.push(titleText);
  if (descriptionText) parts.push(descriptionText);

  let caption = parts.join("\n\n");

  if (topicText && !isKnownCategory(topicText)) {
    caption = caption ? `${caption}\n\n— ${topicText}` : topicText;
  }

  return caption.slice(0, 500);
}

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
