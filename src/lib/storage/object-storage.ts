import "server-only";

import { randomUUID } from "crypto";

import type { StorageUploadKind } from "@/lib/storage-upload-kind";
import {
  createPresignedPutUrl,
  putObjectBytes,
} from "@/lib/storage/s3";
import { deleteMediaKey, recordReadyChurchMedia } from "@/lib/storage/stored-objects";
import type { StoredObjectPurpose, StoredObjectVisibility } from "@/lib/storage/stored-object-rules";

export type { StorageUploadKind };

const SAFE_ID = /^[a-zA-Z0-9_-]+$/;
const SAFE_EXT = /^[a-z0-9]{1,8}$/;

function assertSafeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!SAFE_ID.test(trimmed)) throw new Error(`Invalid ${label}.`);
  return trimmed;
}

function assertSafeExt(ext: string): string {
  const normalized = ext.trim().toLowerCase().replace(/^\./, "");
  if (!SAFE_EXT.test(normalized)) throw new Error("Invalid file extension.");
  return normalized;
}

export function buildShortStorageObjectKey(
  churchId: string,
  shortId: string,
  slot: "video" | "thumbnail",
  ext: string
): string {
  const short = assertSafeSegment(shortId, "short id");
  const fileExt = assertSafeExt(ext);
  if (slot === "thumbnail") {
    return `shorts/${short}/cover/${randomUUID()}.${fileExt}`;
  }
  const church = assertSafeSegment(churchId, "church id");
  return `shorts/${church}/${short}/video.${fileExt}`;
}

export function formatUploadSizeError(message: string, fileSizeBytes?: number): string {
  if (!/maximum allowed size|too large|entity too large/i.test(message)) return message;
  const sizeMb =
    fileSizeBytes != null ? `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : "this size";
  return `Your video (${sizeMb}) exceeds the upload size limit. Compress the video under 100 MB.`;
}

export function mediaFilePath(objectKey: string): string {
  const parts = objectKey.split("/").map((part) => encodeURIComponent(part));
  return `/api/storage/file/${parts.join("/")}`;
}

export async function uploadShortObject(input: {
  churchId: string;
  shortId: string;
  slot: "video" | "thumbnail";
  ext: string;
  body: Buffer | Uint8Array;
  contentType: string;
  trackChurchId?: string | null;
  clerkId?: string | null;
  filename?: string;
}): Promise<{ objectKey: string; publicUrl: string }> {
  const objectKey = buildShortStorageObjectKey(
    input.churchId,
    input.shortId,
    input.slot,
    input.ext
  );
  await putObjectBytes({
    objectKey,
    body: input.body,
    contentType: input.contentType || "application/octet-stream",
  });
  if (input.trackChurchId) {
    await recordReadyChurchMedia({
      churchId: input.trackChurchId,
      clerkId: input.clerkId,
      objectKey,
      filename: input.filename || objectKey,
      mimeType: input.contentType || "application/octet-stream",
      extension: input.ext,
      sizeBytes: input.body.byteLength,
      purpose: input.slot === "video" ? "video" : "image",
      visibility: "public_read",
    });
  }
  return { objectKey, publicUrl: mediaFilePath(objectKey) };
}

export async function createShortSignedUpload(input: {
  churchId: string;
  shortId: string;
  slot: "video" | "thumbnail";
  ext: string;
  contentType: string;
}): Promise<{ objectKey: string; publicUrl: string; signedUrl: string; token: string }> {
  const objectKey = buildShortStorageObjectKey(
    input.churchId,
    input.shortId,
    input.slot,
    input.ext
  );
  const signedUrl = await createPresignedPutUrl({
    objectKey,
    mimeType: input.contentType || "application/octet-stream",
    expiresIn: 300,
  });
  return { objectKey, publicUrl: mediaFilePath(objectKey), signedUrl, token: "s3" };
}

export function isOwnedShortObjectKey(input: {
  objectKey: string;
  churchId: string;
  shortId: string;
  slot: "video" | "thumbnail";
}): boolean {
  const key = input.objectKey.trim();
  if (!key || key.includes("..") || key.startsWith("/")) return false;
  const church = input.churchId.trim();
  const short = input.shortId.trim();
  if (!SAFE_ID.test(church) || !SAFE_ID.test(short)) return false;
  if (input.slot === "video") {
    return new RegExp(`^shorts/${church}/${short}/video\\.[a-z0-9]{1,8}$`).test(key);
  }
  return new RegExp(`^shorts/${short}/cover/[a-zA-Z0-9-]+\\.[a-z0-9]{1,8}$`).test(key);
}

function contentKeyPrefix(kind: StorageUploadKind, entityId: string): string {
  const id = assertSafeSegment(entityId, "entity id");
  switch (kind) {
    case "onboarding":
      return `onboarding/${id}/logo/`;
    case "organization-logo":
      return `organizations/${id}/logo/`;
    case "church-logo":
      return `churches/${id}/logo/`;
    case "church-cover":
      return `churches/${id}/cover/`;
    case "song":
      return `songs/${id}/`;
    case "sermon":
      return `sermons/${id}/`;
    case "article":
      return `articles/${id}/`;
    case "event":
      return `events/${id}/`;
    case "donation":
      return `donations/${id}/`;
    case "book":
      return `books/${id}/cover/`;
    case "group":
      return `groups/${id}/avatar/`;
    case "church-website":
      return `churches/${id}/website/`;
    case "profile-photo":
      return `profiles/${id}/avatar/`;
  }
}

export function isOwnedContentObjectKey(
  kind: StorageUploadKind,
  entityId: string,
  objectKey: string
): boolean {
  const key = objectKey.trim();
  if (!key || key.includes("..") || key.startsWith("/")) return false;
  const prefix = contentKeyPrefix(kind, entityId);
  const rest = key.slice(prefix.length);
  return key.startsWith(prefix) && /^[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i.test(rest);
}

export async function createContentSignedUpload(input: {
  kind: StorageUploadKind;
  entityId: string;
  ext: string;
  contentType: string;
}): Promise<{ objectKey: string; publicUrl: string; signedUrl: string }> {
  const objectKey = buildStorageObjectKey(input.kind, input.entityId, input.ext);
  const signedUrl = await createPresignedPutUrl({
    objectKey,
    mimeType: input.contentType || "application/octet-stream",
    expiresIn: 300,
  });
  return { objectKey, publicUrl: getPublicStorageUrl(objectKey), signedUrl };
}

export function buildStorageObjectKey(
  kind: StorageUploadKind,
  entityId: string,
  ext: string
): string {
  const id = assertSafeSegment(entityId, "entity id");
  const fileExt = assertSafeExt(ext);
  const fileName = `${randomUUID()}.${fileExt}`;
  switch (kind) {
    case "onboarding":
      return `onboarding/${id}/logo/${fileName}`;
    case "organization-logo":
      return `organizations/${id}/logo/${fileName}`;
    case "church-logo":
      return `churches/${id}/logo/${fileName}`;
    case "church-cover":
      return `churches/${id}/cover/${fileName}`;
    case "song":
      return `songs/${id}/${fileName}`;
    case "sermon":
      return `sermons/${id}/${fileName}`;
    case "article":
      return `articles/${id}/${fileName}`;
    case "event":
      return `events/${id}/${fileName}`;
    case "donation":
      return `donations/${id}/${fileName}`;
    case "book":
      return `books/${id}/cover/${fileName}`;
    case "group":
      return `groups/${id}/avatar/${fileName}`;
    case "church-website":
      return `churches/${id}/website/${fileName}`;
    case "profile-photo":
      return `profiles/${id}/avatar/${fileName}`;
  }
}

export function getPublicStorageUrl(objectKey: string): string {
  return mediaFilePath(objectKey);
}

export function getStorageObjectKeyFromUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  const appMarker = "/api/storage/file/";
  const appIndex = trimmed.indexOf(appMarker);
  if (appIndex !== -1) {
    const key = trimmed
      .slice(appIndex + appMarker.length)
      .split("?")[0]
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");
    if (!key || key.includes("..") || key.startsWith("/")) return null;
    return key;
  }
  try {
    const parsed = new URL(trimmed);
    const marker = "/storage/v1/object/public/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    const afterBucket = parsed.pathname.slice(index + marker.length);
    const slash = afterBucket.indexOf("/");
    if (slash === -1) return null;
    const key = decodeURIComponent(afterBucket.slice(slash + 1));
    if (!key || key.includes("..") || key.startsWith("/")) return null;
    return key;
  } catch {
    return null;
  }
}

export async function uploadPublicObject(input: {
  kind: StorageUploadKind;
  entityId: string;
  ext: string;
  body: Buffer | Uint8Array;
  contentType: string;
  filename?: string;
  churchId?: string | null;
  clerkId?: string | null;
  visibility?: StoredObjectVisibility;
}): Promise<{ objectKey: string; publicUrl: string }> {
  const objectKey = buildStorageObjectKey(input.kind, input.entityId, input.ext);
  await putObjectBytes({
    objectKey,
    body: input.body,
    contentType: input.contentType || "application/octet-stream",
  });
  const purpose: StoredObjectPurpose = input.contentType.startsWith("audio/")
    ? "audio"
    : input.contentType.startsWith("video/")
      ? "video"
      : "image";
  if (input.churchId) {
    await recordReadyChurchMedia({
      churchId: input.churchId,
      clerkId: input.clerkId,
      objectKey,
      filename: input.filename || objectKey,
      mimeType: input.contentType || "application/octet-stream",
      extension: input.ext,
      sizeBytes: input.body.byteLength,
      purpose,
      visibility: input.visibility ?? "public_read",
    });
  }
  return { objectKey, publicUrl: getPublicStorageUrl(objectKey) };
}

export async function deletePublicObject(objectKey: string): Promise<void> {
  try {
    await deleteMediaKey(objectKey);
  } catch (error) {
    console.error(
      "[object-storage] Failed to delete object",
      objectKey,
      error instanceof Error ? error.message : "unknown"
    );
  }
}

export async function deleteStoredMediaUrls(
  ...urls: Array<string | null | undefined>
): Promise<void> {
  const keys = [
    ...new Set(urls.map((url) => getStorageObjectKeyFromUrl(url)).filter((key): key is string => Boolean(key))),
  ];
  await Promise.all(keys.map((key) => deletePublicObject(key)));
}
