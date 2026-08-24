function toTxtFilename(title: string): string {
  const slug = title
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "Song"}-Lyrics.txt`;
}

const DIVIDER = "====================================";

export type LyricsTxtOptions = {
  title: string;
  originalLyrics: string;
  translationLyrics: string;
  /** @deprecated use originalLyrics */
  teluguLyrics?: string;
  /** @deprecated use translationLyrics */
  englishLyrics?: string;
};

export function generateLyricsTxt({
  title,
  originalLyrics,
  translationLyrics,
  teluguLyrics,
  englishLyrics,
}: LyricsTxtOptions): Blob {
  const original = originalLyrics || teluguLyrics || "";
  const translation = translationLyrics || englishLyrics || "";

  const parts: string[] = [`Song Title: ${title}`, "", DIVIDER, ""];

  if (original.trim().length > 0) {
    parts.push("ORIGINAL LYRICS", "", original, "", DIVIDER, "");
  }

  if (translation.trim().length > 0) {
    parts.push("TRANSLATION LYRICS", "", translation, "", DIVIDER, "");
  }

  const content = parts.join("\n");
  return new Blob([content], { type: "text/plain;charset=utf-8" });
}

export function getLyricsTxtFilename(title: string): string {
  return toTxtFilename(title);
}
