import {
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from "./firebase-config";

/** New default format (matches Console storageBucket) */
export const NEW_FORMAT_BUCKET = FIREBASE_STORAGE_BUCKET;

/** Legacy default format */
export const LEGACY_FORMAT_BUCKET = `${FIREBASE_PROJECT_ID}.appspot.com`;

export function resolveClientStorageBucket(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    FIREBASE_STORAGE_BUCKET
  );
}

export function resolveAdminStorageBucket(
  serviceAccountBucket?: string
): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    serviceAccountBucket?.trim() ||
    FIREBASE_STORAGE_BUCKET
  );
}

export function getGsUrl(bucket: string): string {
  return bucket.startsWith("gs://") ? bucket : `gs://${bucket}`;
}

export function getStorageRestBaseUrl(bucket: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o`;
}

export function getSongStoragePath(
  songId: string,
  fileType: "cover" | "audio"
): string {
  return `songs/${songId}/${fileType}`;
}

export type StorageDiagnosticInfo = {
  projectId: string;
  clientStorageBucket: string;
  adminStorageBucket: string | null;
  gsUrl: string;
  restApiBase: string;
  adminConfigured: boolean;
  envOverrides: {
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_STORAGE_BUCKET?: string;
  };
};
