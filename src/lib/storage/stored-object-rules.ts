import { randomUUID } from "crypto";

export const STORED_OBJECT_PURPOSES = ["image", "audio", "video"] as const;
export type StoredObjectPurpose = (typeof STORED_OBJECT_PURPOSES)[number];

export const STORED_OBJECT_VISIBILITIES = ["public_read", "private"] as const;
export type StoredObjectVisibility = (typeof STORED_OBJECT_VISIBILITIES)[number];

export const PUT_URL_EXPIRES_SECONDS = 300;
export const GET_URL_EXPIRES_SECONDS = 300;
export const ABANDONED_UPLOAD_AFTER_MS = 60 * 60 * 1000;

const LIMITS: Record<StoredObjectPurpose, number> = {
  image: 2 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const MIME_BY_PURPOSE: Record<StoredObjectPurpose, Record<string, string>> = {
  image: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  },
  audio: {
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
  },
  video: {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  },
};

export function maxBytesForPurpose(purpose: StoredObjectPurpose): number {
  return LIMITS[purpose];
}

export function extensionForMime(
  purpose: StoredObjectPurpose,
  mimeType: string
): string | null {
  return MIME_BY_PURPOSE[purpose][mimeType] ?? null;
}

export function buildStoredObjectKey(churchId: string, extension: string): string {
  return `churches/${churchId}/objects/${randomUUID()}.${extension}`;
}

export function isSha256Hex(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  return /^[a-f0-9]{64}$/.test(value);
}

export function sniffObjectSignature(buffer: Buffer): {
  mimeType: string;
  purpose: StoredObjectPurpose;
  extension: string;
} | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", purpose: "image", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: "image/png", purpose: "image", extension: "png" };
  }
  if (buffer.length >= 6) {
    const gif = buffer.subarray(0, 6).toString("ascii");
    if (gif === "GIF87a" || gif === "GIF89a") {
      return { mimeType: "image/gif", purpose: "image", extension: "gif" };
    }
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", purpose: "image", extension: "webp" };
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") {
      return { mimeType: "image/avif", purpose: "image", extension: "avif" };
    }
    if (brand === "qt  ") {
      return { mimeType: "video/quicktime", purpose: "video", extension: "mov" };
    }
    if (brand === "M4A " || brand === "M4B ") {
      return { mimeType: "audio/mp4", purpose: "audio", extension: "m4a" };
    }
    return { mimeType: "video/mp4", purpose: "video", extension: "mp4" };
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS") {
    return { mimeType: "audio/ogg", purpose: "audio", extension: "ogg" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return { mimeType: "audio/wav", purpose: "audio", extension: "wav" };
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { mimeType: "video/webm", purpose: "video", extension: "webm" };
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "ID3") {
    return { mimeType: "audio/mpeg", purpose: "audio", extension: "mp3" };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { mimeType: "audio/mpeg", purpose: "audio", extension: "mp3" };
  }
  return null;
}

export function completionMayWrite(status: string): boolean {
  return status === "pending";
}

export function deletionMayStart(status: string): boolean {
  return status === "pending" || status === "ready" || status === "failed";
}

/** Legacy objects have no row and stay readable. Tracked objects are public only when ready and published. */
export function publicFileAllowed(
  row: { status: string; visibility: string; published: boolean } | null
): boolean {
  if (!row) return true;
  return row.status === "ready" && row.visibility === "public_read" && row.published === true;
}
