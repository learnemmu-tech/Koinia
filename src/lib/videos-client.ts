"use client";

import type { ChurchVideo } from "@/types/church-video";
import type { ShortCategory } from "@/types/video-short";

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

export async function fetchChurchVideos(
  context: { contentMode?: "platform_public" | "tenant"; churchId?: string },
  token?: string
): Promise<ChurchVideo[]> {
  const params = new URLSearchParams();
  const churchId = context.churchId?.trim() ?? "";
  if (context.contentMode === "tenant" && churchId) {
    params.set("contentMode", "tenant");
    params.set("churchId", churchId);
  }
  const response = await fetch(`/api/videos?${params.toString()}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson<{ videos: ChurchVideo[] }>(response);
  return data.videos;
}

export async function createChurchVideo(
  input: {
    title: string;
    description?: string;
    externalUrl: string;
    thumbnailUrl?: string | null;
    category?: ShortCategory;
    tags?: string[];
    published?: boolean;
    contentScope?: "organization" | "platform_public";
    churchId?: string;
  },
  token: string
) {
  const response = await fetch("/api/videos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(input),
  });
  return parseJson<ChurchVideo>(response);
}

export async function updateChurchVideo(
  videoId: string,
  input: Record<string, unknown>,
  token: string
) {
  const response = await fetch(`/api/videos/${encodeURIComponent(videoId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(input),
  });
  return parseJson<ChurchVideo>(response);
}

export async function deleteChurchVideo(videoId: string, token: string) {
  const response = await fetch(`/api/videos/${encodeURIComponent(videoId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseJson<{ success: boolean }>(response);
}
