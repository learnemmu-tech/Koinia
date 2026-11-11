/**
 * Client upload helper. The browser receives a presigned PUT and writes
 * the file directly to S3. The API route authorizes, then verifies the object.
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

function putFileToSignedUrl(
  signedUrl: string,
  file: Blob,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(30 + Math.round((event.loaded / event.total) * 50));
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

  const signedResponse = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "sign",
      contentType: file.type,
      fileName: file instanceof File ? file.name : "upload",
      size: file.size,
    }),
  });
  if (!signedResponse.ok) {
    let errorMessage = `Upload failed with status ${signedResponse.status}`;
    try {
      const errorJson = (await signedResponse.json()) as UploadError;
      if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }
  const signed = (await signedResponse.json()) as {
    signedUrl: string;
    objectKey: string;
    contentType?: string;
  };
  onProgress?.(30);
  await putFileToSignedUrl(
    signed.signedUrl,
    file,
    signed.contentType || file.type,
    onProgress
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "complete",
      objectKey: signed.objectKey,
    }),
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

export async function uploadGroupImageLocal(
  groupId: string,
  formData: FormData,
  idToken: string,
  replaceUrl?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return postUpload(
    buildUploadUrl("cover", groupId, { kind: "group", replaceUrl }),
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
