import "server-only";

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { StorageUploadKind } from "@/lib/storage-upload-kind";

export type { StorageUploadKind };

const SAFE_ID = /^[a-zA-Z0-9_-]+$/;
const SAFE_EXT = /^[a-z0-9]{1,8}$/;

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SECRET_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "faithconnecthub";
}

let cachedClient: SupabaseClient | null = null;

function getSupabaseStorageClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SECRET_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

function assertSafeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!SAFE_ID.test(trimmed)) {
    throw new Error(`Invalid ${label}.`);
  }
  return trimmed;
}

function assertSafeExt(ext: string): string {
  const normalized = ext.trim().toLowerCase().replace(/^\./, "");
  if (!SAFE_EXT.test(normalized)) {
    throw new Error("Invalid file extension.");
  }
  return normalized;
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
  }
}

export function getPublicStorageUrl(objectKey: string): string {
  const base = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const bucket = getSupabaseStorageBucket();
  return `${base}/storage/v1/object/public/${bucket}/${objectKey}`;
}

export function getStorageObjectKeyFromUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const bucket = getSupabaseStorageBucket();
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    const key = decodeURIComponent(parsed.pathname.slice(index + marker.length));
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
}): Promise<{ objectKey: string; publicUrl: string }> {
  const objectKey = buildStorageObjectKey(input.kind, input.entityId, input.ext);
  const client = getSupabaseStorageClient();
  const { error } = await client.storage
    .from(getSupabaseStorageBucket())
    .upload(objectKey, input.body, {
      contentType: input.contentType || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload file.");
  }

  return {
    objectKey,
    publicUrl: getPublicStorageUrl(objectKey),
  };
}

export async function deletePublicObject(objectKey: string): Promise<void> {
  const key = objectKey.trim();
  if (!key || key.includes("..")) return;

  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(getSupabaseStorageBucket()).remove([key]);
  if (error) {
    console.error("[supabase-storage] Failed to delete object", key, error.message);
  }
}

export async function deleteStoredMediaUrls(
  ...urls: Array<string | null | undefined>
): Promise<void> {
  const keys = urls
    .map((url) => getStorageObjectKeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  if (keys.length === 0) return;

  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(getSupabaseStorageBucket()).remove(keys);
  if (error) {
    console.error("[supabase-storage] Failed to delete objects", error.message);
  }
}
