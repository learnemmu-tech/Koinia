"use client";

import type {
  ShortCategory,
  ShortVisibility,
  ShortsFeedFilter,
  VideoShort,
  VideoShortComment,
} from "@/types/video-short";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(error?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function authHeaders(token?: string): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchShortsFeed(
  filter: ShortsFeedFilter,
  token?: string
): Promise<VideoShort[]> {
  const response = await fetch(`/api/shorts?filter=${filter}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson<{ shorts: VideoShort[] }>(response);
  return data.shorts;
}

export async function createShortDraft(
  input: {
    caption: string;
    category: ShortCategory;
    visibility: ShortVisibility;
  },
  token: string
) {
  const response = await fetch("/api/shorts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ id: string; churchId: string }>(response);
}

export async function uploadShortFile(
  shortId: string,
  slot: "video" | "thumbnail",
  file: File,
  token: string,
  onProgress?: (percent: number) => void
) {
  onProgress?.(10);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `/api/shorts/upload?shortId=${encodeURIComponent(shortId)}&slot=${slot}`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: formData,
    }
  );
  onProgress?.(90);
  const data = await parseJson<{ url: string }>(response);
  onProgress?.(100);
  return data.url;
}

export async function publishShort(
  shortId: string,
  input: {
    videoUrl: string;
    thumbnailUrl?: string | null;
    duration?: number;
    caption: string;
    category: ShortCategory;
    visibility: ShortVisibility;
  },
  token: string
) {
  const response = await fetch(`/api/shorts/${encodeURIComponent(shortId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ id: string; publishedAt?: string }>(response);
}

export async function updateShortCover(
  shortId: string,
  thumbnailUrl: string | null,
  token: string
) {
  const response = await fetch(`/api/shorts/${encodeURIComponent(shortId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ thumbnailUrl }),
  });
  return parseJson<{ id: string; thumbnailUrl: string | null }>(response);
}

export async function deleteShort(shortId: string, token: string) {
  const response = await fetch(`/api/shorts/${encodeURIComponent(shortId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseJson<{ success: boolean }>(response);
}

export async function toggleShortLike(shortId: string, token: string) {
  const response = await fetch(
    `/api/shorts/${encodeURIComponent(shortId)}/like`,
    {
      method: "POST",
      headers: authHeaders(token),
    }
  );
  return parseJson<{ liked: boolean; likeCount: number }>(response);
}

export async function fetchShortComments(shortId: string) {
  const response = await fetch(
    `/api/shorts/${encodeURIComponent(shortId)}/comments`
  );
  const data = await parseJson<{ comments: VideoShortComment[] }>(response);
  return data.comments;
}

export async function postShortComment(
  shortId: string,
  body: string,
  token: string
) {
  const response = await fetch(
    `/api/shorts/${encodeURIComponent(shortId)}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ body }),
    }
  );
  return parseJson<{ id: string; body: string; createdAt: string }>(response);
}

export async function reportShort(
  shortId: string,
  reason: string,
  token: string
) {
  const response = await fetch(
    `/api/shorts/${encodeURIComponent(shortId)}/report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ reason }),
    }
  );
  return parseJson<{ reported: boolean }>(response);
}
