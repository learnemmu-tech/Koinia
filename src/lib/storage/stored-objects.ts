import "server-only";

import { and, eq, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import { storedObjects } from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchById } from "@/lib/postgres/tenants";
import {
  ABANDONED_UPLOAD_AFTER_MS,
  GET_URL_EXPIRES_SECONDS,
  PUT_URL_EXPIRES_SECONDS,
  buildStoredObjectKey,
  completionMayWrite,
  deletionMayStart,
  extensionForMime,
  isSha256Hex,
  maxBytesForPurpose,
  publicFileAllowed,
  sniffObjectSignature,
  type StoredObjectPurpose,
  type StoredObjectVisibility,
} from "@/lib/storage/stored-object-rules";
import {
  createPresignedGetUrl,
  createPresignedPutUrl,
  deleteStoredObject,
  headStoredObject,
  readObjectPrefix,
  readObjectSha256,
} from "@/lib/storage/s3";

export class StoredObjectError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function safeFilename(filename: string): string {
  const trimmed = filename.trim().slice(0, 180);
  if (!trimmed || trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) {
    throw new StoredObjectError("Invalid filename.", 400);
  }
  return trimmed;
}

export async function createStoredObjectUpload(input: {
  clerkId: string;
  churchId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  visibility: StoredObjectVisibility;
  purpose: StoredObjectPurpose;
  sha256?: string | null;
}) {
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 1) {
    throw new StoredObjectError("Invalid file size.", 400);
  }
  if (input.sizeBytes > maxBytesForPurpose(input.purpose)) {
    throw new StoredObjectError("File exceeds the size limit.", 400);
  }
  const extension = extensionForMime(input.purpose, input.mimeType);
  if (!extension) {
    throw new StoredObjectError("File type is not allowed.", 400);
  }
  if (!isSha256Hex(input.sha256)) {
    throw new StoredObjectError("Invalid checksum.", 400);
  }
  const church = await getChurchById(input.churchId);
  if (!church?.organizationId) {
    throw new StoredObjectError("Church not found.", 404);
  }
  const uploader = await getAppUserByClerkId(input.clerkId);
  const objectKey = buildStoredObjectKey(church.id, extension);
  const [row] = await db
    .insert(storedObjects)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      uploadedBy: uploader?.id ?? null,
      objectKey,
      originalFilename: safeFilename(input.filename),
      mimeType: input.mimeType,
      extension,
      sizeBytes: input.sizeBytes,
      sha256: input.sha256?.trim() || null,
      visibility: input.visibility,
      purpose: input.purpose,
      status: "pending",
      published: false,
    })
    .returning({ id: storedObjects.id, objectKey: storedObjects.objectKey });
  if (!row) throw new StoredObjectError("Could not create upload.", 500);
  const uploadUrl = await createPresignedPutUrl({
    objectKey: row.objectKey,
    mimeType: input.mimeType,
    expiresIn: PUT_URL_EXPIRES_SECONDS,
  });
  return {
    objectId: row.id,
    objectKey: row.objectKey,
    uploadUrl,
    expiresIn: PUT_URL_EXPIRES_SECONDS,
  };
}

async function markFailed(objectId: string): Promise<void> {
  await db
    .update(storedObjects)
    .set({ status: "failed", updatedAt: new Date(), readyAt: null })
    .where(and(eq(storedObjects.id, objectId), eq(storedObjects.status, "pending")));
}

export async function completeStoredObjectUpload(input: {
  objectId: string;
  publish: boolean;
}) {
  const [current] = await db
    .select()
    .from(storedObjects)
    .where(eq(storedObjects.id, input.objectId))
    .limit(1);
  if (!current) throw new StoredObjectError("Upload not found.", 404);
  if (!completionMayWrite(current.status)) {
    throw new StoredObjectError("Upload can no longer be completed.", 409);
  }
  if (input.publish && current.visibility !== "public_read") {
    throw new StoredObjectError("Private objects cannot be published.", 400);
  }

  let failure: string | null = null;
  try {
    const head = await headStoredObject(current.objectKey);
    const size = Number(head.ContentLength ?? -1);
    if (size !== current.sizeBytes) failure = "Uploaded size does not match.";
    const prefix = await readObjectPrefix(current.objectKey, 64);
    const sniffed = sniffObjectSignature(prefix);
    if (!sniffed || sniffed.mimeType !== current.mimeType || sniffed.purpose !== current.purpose) {
      failure = failure ?? "File signature does not match the declared type.";
    }
    if (!failure && current.sha256) {
      const actual = await readObjectSha256(current.objectKey);
      if (actual !== current.sha256) failure = "Checksum does not match.";
    }
  } catch {
    failure = "Uploaded object could not be verified.";
  }

  if (failure) {
    await markFailed(current.id);
    throw new StoredObjectError(failure, 409);
  }

  const [ready] = await db
    .update(storedObjects)
    .set({
      status: "ready",
      published: input.publish,
      readyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(storedObjects.id, current.id), eq(storedObjects.status, "pending")))
    .returning({
      id: storedObjects.id,
      status: storedObjects.status,
      published: storedObjects.published,
    });
  if (!ready) {
    throw new StoredObjectError("Upload can no longer be completed.", 409);
  }
  return ready;
}

export async function readReadyObjectAccess(objectId: string) {
  const [row] = await db
    .select({
      churchId: storedObjects.churchId,
      visibility: storedObjects.visibility,
      published: storedObjects.published,
      status: storedObjects.status,
      objectKey: storedObjects.objectKey,
    })
    .from(storedObjects)
    .where(eq(storedObjects.id, objectId))
    .limit(1);
  if (!row || row.status !== "ready") {
    throw new StoredObjectError("Object not found.", 404);
  }
  return row;
}

export async function presignObjectKey(objectKey: string) {
  const url = await createPresignedGetUrl({
    objectKey,
    expiresIn: GET_URL_EXPIRES_SECONDS,
  });
  return { url, expiresIn: GET_URL_EXPIRES_SECONDS };
}

export async function deleteStoredObjectRecord(objectId: string): Promise<"gone" | "retry"> {
  const [current] = await db
    .select()
    .from(storedObjects)
    .where(eq(storedObjects.id, objectId))
    .limit(1);
  if (!current) return "gone";

  if (deletionMayStart(current.status)) {
    const [locked] = await db
      .update(storedObjects)
      .set({ status: "deleting", updatedAt: new Date() })
      .where(
        and(
          eq(storedObjects.id, objectId),
          inArray(storedObjects.status, ["pending", "ready", "failed"])
        )
      )
      .returning({ objectKey: storedObjects.objectKey });
    if (!locked) return deleteStoredObjectRecord(objectId);
  } else if (current.status !== "deleting") {
    throw new StoredObjectError("Object cannot be deleted.", 409);
  }

  const [deleting] = await db
    .select({ objectKey: storedObjects.objectKey })
    .from(storedObjects)
    .where(and(eq(storedObjects.id, objectId), eq(storedObjects.status, "deleting")))
    .limit(1);
  if (!deleting) return "gone";

  try {
    await deleteStoredObject(deleting.objectKey);
  } catch (error) {
    console.error("[stored-objects] S3 delete failed", {
      objectId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return "retry";
  }

  await db
    .delete(storedObjects)
    .where(and(eq(storedObjects.id, objectId), eq(storedObjects.status, "deleting")));
  return "gone";
}

export async function recordReadyChurchMedia(input: {
  churchId: string;
  clerkId?: string | null;
  objectKey: string;
  filename: string;
  mimeType: string;
  extension: string;
  sizeBytes?: number;
  purpose: StoredObjectPurpose;
  visibility: StoredObjectVisibility;
}): Promise<void> {
  const church = await getChurchById(input.churchId);
  if (!church?.organizationId) {
    throw new StoredObjectError("Church not found.", 404);
  }
  const head = await headStoredObject(input.objectKey);
  const size = Number(head.ContentLength ?? -1);
  if (size < 1 || (input.sizeBytes != null && input.sizeBytes !== size)) {
    throw new StoredObjectError("Uploaded size does not match.", 409);
  }
  const uploader = input.clerkId ? await getAppUserByClerkId(input.clerkId) : null;
  await db
    .insert(storedObjects)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      uploadedBy: uploader?.id ?? null,
      objectKey: input.objectKey,
      originalFilename: safeFilename(input.filename),
      mimeType: input.mimeType,
      extension: input.extension,
      sizeBytes: size,
      visibility: input.visibility,
      purpose: input.purpose,
      status: "ready",
      published: input.visibility === "public_read",
      readyAt: new Date(),
    })
    .onConflictDoNothing({ target: storedObjects.objectKey });
}

export async function publicObjectIsReadable(objectKey: string): Promise<boolean> {
  const [row] = await db
    .select({
      status: storedObjects.status,
      visibility: storedObjects.visibility,
      published: storedObjects.published,
    })
    .from(storedObjects)
    .where(eq(storedObjects.objectKey, objectKey))
    .limit(1);
  return publicFileAllowed(row ?? null);
}

export async function deleteMediaKey(objectKey: string): Promise<void> {
  const key = objectKey.trim();
  if (!key || key.includes("..")) return;
  const [row] = await db
    .select({ id: storedObjects.id })
    .from(storedObjects)
    .where(eq(storedObjects.objectKey, key))
    .limit(1);
  if (!row) {
    await deleteStoredObject(key);
    return;
  }
  const result = await deleteStoredObjectRecord(row.id);
  if (result === "retry") {
    throw new StoredObjectError("Object deletion could not be finished.", 502);
  }
}

export async function cleanupAbandonedUploads(now = Date.now()): Promise<number> {
  const cutoff = new Date(now - ABANDONED_UPLOAD_AFTER_MS);
  const stale = await db
    .select({ id: storedObjects.id })
    .from(storedObjects)
    .where(and(eq(storedObjects.status, "pending"), lt(storedObjects.createdAt, cutoff)));
  let removed = 0;
  for (const row of stale) {
    const result = await deleteStoredObjectRecord(row.id);
    if (result === "gone") removed += 1;
  }
  return removed;
}
