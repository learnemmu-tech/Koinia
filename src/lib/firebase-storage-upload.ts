"use server";

import { getAdminBucket, getAdminStorageBucketName, isAdminConfigured } from "./firebase-admin";
import { FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET } from "./firebase-config";
import {
  MAX_AUDIO_SIZE_BYTES,
  MAX_AUDIO_SIZE_LABEL,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_LABEL,
  validateAudioFile,
  validateImageFile,
} from "./upload-limits";
import {
  getSongStoragePath,
  getStorageRestBaseUrl,
  type StorageDiagnosticInfo,
} from "./firebase-storage-config";
import { storageLog } from "./firebase-storage-logger";

const STORAGE_PERMISSION_HELP =
  "Storage upload failed. Ensure: (1) Firebase Storage is enabled in Console, (2) storage.rules are published, (3) FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON (not a placeholder), (4) bucket name matches Console — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_STORAGE_BUCKET if needed.";

async function buildDownloadUrl(
  bucketName: string,
  path: string
): Promise<string> {
  const bucket = getAdminBucket();
  if (!bucket) {
    throw new Error(STORAGE_PERMISSION_HELP);
  }

  const file = bucket.file(path);

  storageLog.downloadUrl("Fetching file metadata for download URL", {
    bucket: bucketName,
    path,
  });

  const [metadata] = await file.getMetadata();
  const token = metadata.metadata?.firebaseStorageDownloadTokens;

  if (token) {
    const url = `${getStorageRestBaseUrl(bucketName)}/${encodeURIComponent(path)}?alt=media&token=${token}`;
    storageLog.downloadUrl("Generated token-based download URL", {
      bucket: bucketName,
      path,
      urlPreview: url.slice(0, 120) + "...",
    });
    return url;
  }

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  storageLog.downloadUrl("Generated signed download URL", {
    bucket: bucketName,
    path,
  });

  return signedUrl;
}

/**
 * Server-side upload via Admin SDK — bypasses browser CORS entirely.
 */
export async function uploadSongFileServer(
  songId: string,
  fileType: "cover" | "audio",
  formData: FormData
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("No file provided");
  }

  const sizeError =
    fileType === "cover" ?
      file.size > MAX_IMAGE_SIZE_BYTES ?
        `Cover image must be ${MAX_IMAGE_SIZE_LABEL} or smaller`
      : file instanceof File ?
        validateImageFile(file)
      : null
    : file.size > MAX_AUDIO_SIZE_BYTES ?
      `Audio file must be ${MAX_AUDIO_SIZE_LABEL} or smaller`
    : file instanceof File ?
      validateAudioFile(file)
    : null;

  if (sizeError) {
    storageLog.error("File rejected by size validation", new Error(sizeError), {
      songId,
      fileType,
      fileSize: file.size,
    });
    throw new Error(sizeError);
  }

  if (!isAdminConfigured()) {
    storageLog.error(
      "Admin SDK not configured — cannot upload from server",
      new Error("Missing valid FIREBASE_SERVICE_ACCOUNT_KEY"),
      { songId, fileType }
    );
    throw new Error(
      `${STORAGE_PERMISSION_HELP} Browser uploads are disabled because they fail with CORS when the bucket/rules are misconfigured.`
    );
  }

  const bucket = getAdminBucket();
  const bucketName = getAdminStorageBucketName();

  if (!bucket || !bucketName) {
    throw new Error(STORAGE_PERMISSION_HELP);
  }

  const path = getSongStoragePath(songId, fileType);
  const buffer = Buffer.from(await file.arrayBuffer());

  storageLog.uploadStart("Starting server upload", {
    songId,
    fileType,
    path,
    bucket: bucketName,
    fileSize: buffer.length,
    contentType: file.type || "unknown",
    restApiBase: getStorageRestBaseUrl(bucketName),
  });

  try {
    await bucket.file(path).save(buffer, {
      metadata: {
        contentType: file.type || undefined,
      },
    });

    storageLog.uploadSuccess("File saved to bucket", {
      songId,
      fileType,
      path,
      bucket: bucketName,
    });

    const downloadUrl = await buildDownloadUrl(bucketName, path);

    storageLog.uploadSuccess("Upload complete with download URL", {
      songId,
      fileType,
      path,
      bucket: bucketName,
    });

    return downloadUrl;
  } catch (error) {
    storageLog.error("Server upload failed", error, {
      songId,
      fileType,
      path,
      bucket: bucketName,
    });
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function deleteSongStorageFiles(songId: string): Promise<void> {
  const bucket = getAdminBucket();
  const bucketName = getAdminStorageBucketName();

  if (!bucket || !bucketName) return;

  for (const fileType of ["cover", "audio"] as const) {
    const path = getSongStoragePath(songId, fileType);
    try {
      await bucket.file(path).delete();
      storageLog.uploadSuccess("Deleted storage file", { songId, path, bucket: bucketName });
    } catch (error) {
      storageLog.error("Failed to delete storage file (may not exist)", error, {
        songId,
        path,
      });
    }
  }
}

export async function getStorageDiagnostics(): Promise<StorageDiagnosticInfo> {
  const sa = isAdminConfigured();
  return {
    projectId: FIREBASE_PROJECT_ID,
    clientStorageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
      FIREBASE_STORAGE_BUCKET,
    adminStorageBucket: getAdminStorageBucketName(),
    gsUrl: `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || FIREBASE_STORAGE_BUCKET}`,
    restApiBase: getStorageRestBaseUrl(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
        FIREBASE_STORAGE_BUCKET
    ),
    adminConfigured: sa,
    envOverrides: {
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    },
  };
}
