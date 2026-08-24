const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[\w-]+/i;

export function isValidYouTubeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (!YOUTUBE_URL_PATTERN.test(trimmed)) return false;
  return getYouTubeVideoId(trimmed) !== null;
}

export function getYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function isValidAudioUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith("/")) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
