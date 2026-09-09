import "server-only";

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function getProtectedBucket(): string {
  return (
    process.env.BOOKS_PROTECTED_BUCKET?.trim() ||
    process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
    "faithconnecthub"
  );
}

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  return cachedClient;
}

function assertSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!SAFE_SEGMENT.test(trimmed)) {
    throw new Error(`Invalid ${label}.`);
  }
  return trimmed;
}

/**
 * Object storage for protected book files.
 * The current adapter uses Supabase Storage with short-lived signed URLs.
 * Swap this module for Cloudflare R2 without changing book access APIs.
 */
export function buildProtectedBookObjectKey(
  organizationId: string,
  bookId: string,
  ext: string
): string {
  const org = assertSegment(organizationId, "organization id");
  const book = assertSegment(bookId, "book id");
  const fileExt = ext.trim().toLowerCase().replace(/^\./, "");
  if (!/^[a-z0-9]{1,8}$/.test(fileExt)) {
    throw new Error("Invalid file extension.");
  }
  return `books/protected/${org}/${book}/${randomUUID()}.${fileExt}`;
}

export async function putProtectedBookObject(input: {
  organizationId: string;
  bookId: string;
  ext: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ objectKey: string }> {
  const objectKey = buildProtectedBookObjectKey(
    input.organizationId,
    input.bookId,
    input.ext
  );
  const { error } = await getClient()
    .storage.from(getProtectedBucket())
    .upload(objectKey, input.body, {
      contentType: input.contentType || "application/pdf",
      upsert: false,
    });
  if (error) {
    throw new Error(error.message || "Failed to store the digital book file.");
  }
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
  const downloadName = options?.downloadFileName?.trim();
  const { data, error } = await getClient()
    .storage.from(getProtectedBucket())
    .createSignedUrl(
      key,
      expiresInSeconds,
      downloadName ? { download: downloadName } : undefined
    );
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create a download URL.");
  }
  return data.signedUrl;
}

export async function deleteProtectedBookObject(
  objectKey: string | null | undefined
): Promise<void> {
  const key = objectKey?.trim();
  if (!key || !key.startsWith("books/protected/") || key.includes("..")) return;
  const { error } = await getClient()
    .storage.from(getProtectedBucket())
    .remove([key]);
  if (error) {
    console.error("[book-storage] Failed to delete object", key, error.message);
  }
}
