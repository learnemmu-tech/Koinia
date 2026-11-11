import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export function getS3Bucket(): string {
  return env.AWS_S3_BUCKET;
}

export function createPresignedPutUrl(input: {
  objectKey: string;
  mimeType: string;
  expiresIn: number;
}): Promise<string> {
  return getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: input.objectKey,
      ContentType: input.mimeType,
    }),
    { expiresIn: input.expiresIn }
  );
}

export function createPresignedGetUrl(input: {
  objectKey: string;
  expiresIn: number;
  downloadFileName?: string | null;
}): Promise<string> {
  const downloadName = input.downloadFileName?.trim();
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: input.objectKey,
      ResponseContentDisposition: downloadName
        ? `attachment; filename="${downloadName.replace(/["\r\n]/g, "")}"`
        : undefined,
    }),
    { expiresIn: input.expiresIn }
  );
}

export async function putObjectBytes(input: {
  objectKey: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: input.objectKey,
      Body: input.body,
      ContentType: input.contentType || "application/octet-stream",
    })
  );
}

export async function readObject(objectKey: string) {
  return getS3Client().send(
    new GetObjectCommand({ Bucket: getS3Bucket(), Key: objectKey })
  );
}

export function headStoredObject(objectKey: string): Promise<HeadObjectCommandOutput> {
  return getS3Client().send(
    new HeadObjectCommand({ Bucket: getS3Bucket(), Key: objectKey })
  );
}

export async function readObjectPrefix(objectKey: string, bytes: number): Promise<Buffer> {
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: objectKey,
      Range: `bytes=0-${bytes - 1}`,
    })
  );
  const body = response.Body;
  if (!body) return Buffer.alloc(0);
  return Buffer.from(await body.transformToByteArray());
}

export async function readObjectSha256(objectKey: string): Promise<string> {
  const { createHash } = await import("crypto");
  const response = await getS3Client().send(
    new GetObjectCommand({ Bucket: getS3Bucket(), Key: objectKey })
  );
  if (!response.Body) throw new Error("S3 object body is empty.");
  const hash = createHash("sha256");
  hash.update(Buffer.from(await response.Body.transformToByteArray()));
  return hash.digest("hex");
}

export async function deleteStoredObject(objectKey: string): Promise<"deleted" | "missing"> {
  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: objectKey })
    );
    return "deleted";
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const code =
      typeof error === "object" && error && "Code" in error
        ? String((error as { Code?: string }).Code)
        : "";
    if (name === "NotFound" || name === "NoSuchKey" || code === "NoSuchKey") {
      return "missing";
    }
    throw error;
  }
}
