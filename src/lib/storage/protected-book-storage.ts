import "server-only";

import { randomUUID } from "crypto";

import { createPresignedGetUrl, deleteStoredObject, putObjectBytes } from "@/lib/storage/s3";

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function assertSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!SAFE_SEGMENT.test(trimmed)) throw new Error(`Invalid ${label}.`);
  return trimmed;
}

export function buildProtectedBookObjectKey(
  organizationId: string,
  bookId: string,
  ext: string
): string {
  const org = assertSegment(organizationId, "organization id");
  const book = assertSegment(bookId, "book id");
  const fileExt = ext.trim().toLowerCase().replace(/^\./, "");
  if (!/^[a-z0-9]{1,8}$/.test(fileExt)) throw new Error("Invalid file extension.");
  return `books/protected/${org}/${book}/${randomUUID()}.${fileExt}`;
}

export async function putProtectedBookObject(input: {
  organizationId: string;
  bookId: string;
  ext: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ objectKey: string }> {
  const objectKey = buildProtectedBookObjectKey(input.organizationId, input.bookId, input.ext);
  await putObjectBytes({
    objectKey,
    body: input.body,
    contentType: input.contentType || "application/pdf",
  });
  return { objectKey };
}

export async function createProtectedBookDownloadUrl(
  objectKey: string,
  expiresInSeconds = 120,
  options?: { downloadFileName?: string | null }
): Promise<string> {
  const key = objectKey.trim();
  if (!key.startsWith("books/protected/") || key.includes("..")) {
    throw new Error("Invalid book file key.");
  }
  return createPresignedGetUrl({
    objectKey: key,
    expiresIn: expiresInSeconds,
    downloadFileName: options?.downloadFileName,
  });
}

export async function deleteProtectedBookObject(objectKey: string | null | undefined): Promise<void> {
  const key = objectKey?.trim();
  if (!key || !key.startsWith("books/protected/") || key.includes("..")) return;
  try {
    await deleteStoredObject(key);
  } catch (error) {
    console.error(
      "[book-storage] Failed to delete object",
      key,
      error instanceof Error ? error.message : "unknown"
    );
  }
}
