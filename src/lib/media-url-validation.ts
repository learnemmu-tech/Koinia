import type { ChurchVideoProvider } from "@/types/church-video";

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)[\w-]+/i;

export function isValidYouTubeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (!YOUTUBE_URL_PATTERN.test(trimmed)) return false;
  return getYouTubeVideoId(trimmed) !== null;
}

export function getYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getVimeoVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "player.vimeo.com") {
      const match = parsed.pathname.match(/^\/video\/(\d+)/);
      return match?.[1] ?? null;
    }
    if (host === "vimeo.com") {
      const match = parsed.pathname.match(/^\/(\d+)/);
      return match?.[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  const id = getVimeoVideoId(url);
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

export function getInstagramPermalink(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "instagram.com" && host !== "instagr.am") return null;
    if (!/^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i.test(parsed.pathname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export type ParsedChurchVideoUrl = {
  provider: ChurchVideoProvider;
  canonicalUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
};

export function parseChurchVideoUrl(url: string): ParsedChurchVideoUrl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const youtubeId = getYouTubeVideoId(withProtocol);
  if (youtubeId) {
    return {
      provider: "youtube",
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  const vimeoId = getVimeoVideoId(withProtocol);
  if (vimeoId) {
    return {
      provider: "vimeo",
      canonicalUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: null,
    };
  }

  const instagram = getInstagramPermalink(withProtocol);
  if (instagram) {
    return {
      provider: "instagram",
      canonicalUrl: instagram,
      embedUrl: null,
      thumbnailUrl: null,
    };
  }

  return null;
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
