/**
 * Client upload helper. Files are stored in Supabase Storage via /api/upload.
 */

import type { StorageUploadKind } from "@/lib/storage-upload-kind";

type UploadResponse = {
  success: boolean;
  url: string;
  fileName: string;
  size: number;
};

type UploadError = {
  error: string;
  details?: string;
};

export type ClientUploadOptions = {
  kind?: StorageUploadKind;
  replaceUrl?: string;
};

function buildUploadUrl(
  fileType: "cover" | "audio",
  entityId: string,
  options?: ClientUploadOptions & { scope?: "onboarding" }
): string {
  const params = new URLSearchParams({
    type: fileType,
    songId: entityId,
  });
  if (options?.kind) params.set("kind", options.kind);
  if (options?.scope) params.set("scope", options.scope);
  if (options?.replaceUrl) params.set("replaceUrl", options.replaceUrl);
  return `/api/upload?${params.toString()}`;
}

async function postUpload(
  url: string,
  formData: FormData,
  idToken: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("No file provided");
  }

  if (!idToken.trim()) {
    throw new Error("You must be signed in to upload files.");
  }

  onProgress?.(10);

  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  onProgress?.(30);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: uploadFormData,
  });

  onProgress?.(80);

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errorJson = (await response.json()) as UploadError;
      if (errorJson.error) {
        errorMessage = errorJson.details
          ? `${errorJson.error}: ${errorJson.details}`
          : errorJson.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as UploadResponse;
  onProgress?.(100);
  return data.url;
}

export async function uploadOnboardingLogoLocal(
  userId: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  idToken?: string
): Promise<string> {
  if (!idToken?.trim()) {
    throw new Error("You must be signed in to upload files.");
  }

  return postUpload(
    buildUploadUrl("cover", userId, { kind: "onboarding", scope: "onboarding" }),
    formData,
    idToken,
    onProgress
  );
}

export async function uploadSongFileLocal(
  songId: string,
  fileType: "cover" | "audio",
  formData: FormData,
  onProgress?: (percent: number) => void,
  idToken?: string,
  options?: ClientUploadOptions
): Promise<string> {
  if (!idToken?.trim()) {
    throw new Error("You must be signed in to upload files.");
  }

  return postUpload(
    buildUploadUrl(fileType, songId, options),
    formData,
    idToken,
    onProgress
  );
}
