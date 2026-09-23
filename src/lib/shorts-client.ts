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
  token?: string,
  query?: string,
  context?: { contentMode?: "platform_public" | "tenant"; churchId?: string }
): Promise<VideoShort[]> {
  const params = new URLSearchParams({ filter });
  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  const churchId = context?.churchId?.trim() ?? "";
  if (context?.contentMode === "tenant" && churchId) {
    params.set("contentMode", "tenant");
    params.set("churchId", churchId);
  }

  const response = await fetch(`/api/shorts?${params.toString()}`, {
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
    contentScope?: "organization" | "platform_public";
    churchId?: string;
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
  return parseJson<{ id: string; churchId: string | null; contentScope?: string }>(
    response
  );
}

function putFileToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 80) + 15;
      onProgress?.(Math.min(95, percent));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Direct upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Direct upload failed."));
    xhr.send(file);
  });
}

async function uploadShortFileViaProxy(
  shortId: string,
  slot: "video" | "thumbnail",
  file: File,
  token: string,
  onProgress?: (percent: number) => void
) {
  onProgress?.(20);
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

export async function uploadShortFile(
  shortId: string,
  slot: "video" | "thumbnail",
  file: File,
  token: string,
  onProgress?: (percent: number) => void
) {
  onProgress?.(8);

  try {
    const signedResponse = await fetch(
      `/api/shorts/upload?shortId=${encodeURIComponent(shortId)}&slot=${slot}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          action: "sign",
          contentType: file.type,
          fileName: file.name,
          size: file.size,
        }),
      }
    );
    const signed = await parseJson<{
      signedUrl: string;
      objectKey: string;
      publicUrl: string;
    }>(signedResponse);

    onProgress?.(15);
    await putFileToSignedUrl(signed.signedUrl, file, onProgress);

    const completeResponse = await fetch(
      `/api/shorts/upload?shortId=${encodeURIComponent(shortId)}&slot=${slot}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          action: "complete",
          objectKey: signed.objectKey,
        }),
      }
    );
    const completed = await parseJson<{ url: string }>(completeResponse);
    onProgress?.(100);
    return completed.url;
  } catch {
    return uploadShortFileViaProxy(shortId, slot, file, token, onProgress);
  }
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
  return parseJson<{
    id: string;
    publishedAt?: string | null;
    moderationStatus?: string;
    submittedForReview?: boolean;
  }>(response);
}

export async function fetchPendingReviewShorts(
  churchId: string,
  token: string
): Promise<VideoShort[]> {
  const params = new URLSearchParams({
    filter: "pending_review",
    churchId,
    contentMode: "tenant",
  });
  const response = await fetch(`/api/shorts?${params.toString()}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson<{ shorts: VideoShort[] }>(response);
  return data.shorts;
}

export async function moderateShort(
  shortId: string,
  action: "approve" | "reject",
  token: string
) {
  const response = await fetch(`/api/shorts/${encodeURIComponent(shortId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ action }),
  });
  return parseJson<{
    id: string;
    moderationStatus?: string;
    publishedAt?: string | null;
  }>(response);
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
  token: string,
  parentId?: string | null
) {
  const response = await fetch(
    `/api/shorts/${encodeURIComponent(shortId)}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ body, parentId: parentId ?? null }),
    }
  );
  return parseJson<{
    id: string;
    body: string;
    parentId: string | null;
    createdAt: string;
  }>(response);
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
