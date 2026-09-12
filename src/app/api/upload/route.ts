import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  getArticleById,
  getEventById,
  getSermonById,
  getSongById,
} from "@/lib/postgres/content-mutations";
import { getDonationCampaignById } from "@/lib/postgres/features";
import { getOrgMembershipRow, userCanManageChurch } from "@/lib/postgres/session";
import { getChurchById, getOrganizationById } from "@/lib/postgres/tenants";
import type { StorageUploadKind } from "@/lib/storage-upload-kind";
import { rateLimitUploadRequest } from "@/lib/rate-limit";
import {
  deleteStoredMediaUrls,
  getStorageObjectKeyFromUrl,
  uploadPublicObject,
} from "@/lib/supabase-storage";
import { roleMeetsMinimum } from "@/types/membership";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_AUDIO_SIZE = 20 * 1024 * 1024;

const UPLOAD_KINDS: StorageUploadKind[] = [
  "onboarding",
  "organization-logo",
  "church-logo",
  "church-cover",
  "song",
  "sermon",
  "article",
  "event",
  "donation",
];

function isUploadKind(value: string | null): value is StorageUploadKind {
  return Boolean(value && UPLOAD_KINDS.includes(value as StorageUploadKind));
}

function getFileExtension(mimeType: string, fileName: string): string {
  const types: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
    "video/mp4": "m4a",
  };

  const extFromType = types[mimeType];
  if (extFromType) return extFromType;

  const extFromName = fileName.split(".").pop()?.toLowerCase();
  if (extFromName) return extFromName;

  return "bin";
}

/** Magic-byte sniff for common raster formats (rejects SVG/HTML spoofing). */
function sniffImageContentType(buffer: Buffer): {
  contentType: string;
  ext: string;
} | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { contentType: "image/png", ext: "png" };
  }
  if (buffer.length >= 6) {
    const head = buffer.subarray(0, 6).toString("ascii");
    if (head === "GIF87a" || head === "GIF89a") {
      return { contentType: "image/gif", ext: "gif" };
    }
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { contentType: "image/webp", ext: "webp" };
  }
  // AVIF: ISO BMFF with 'ftyp' + 'avif'/'avis'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") {
      return { contentType: "image/avif", ext: "avif" };
    }
  }
  return null;
}

function looksLikeAudio(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // ID3 tag or MPEG frame sync
  if (buffer.subarray(0, 3).toString("ascii") === "ID3") return true;
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true;
  // WAV
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.length >= 12 &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return true;
  }
  // OGG
  if (buffer.subarray(0, 4).toString("ascii") === "OggS") return true;
  // MP4/M4A
  if (buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return true;
  }
  return false;
}

function resolveKind(
  kindParam: string | null,
  type: "cover" | "audio",
  scope: string | null
): StorageUploadKind {
  if (isUploadKind(kindParam)) return kindParam;
  if (scope === "onboarding") return "onboarding";
  if (type === "audio") return "song";
  return "song";
}

type UploadContentRecord = {
  contentScope?: string;
  churchId?: string | null;
};

async function authorizeContentUpload(
  uid: string,
  email: string | undefined,
  record: UploadContentRecord | null
): Promise<true | NextResponse> {
  if (!record) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (record.contentScope === "platform_public") {
    const appUser = await getAppUserByClerkId(uid);
    if (!isPlatformSuperAdmin(appUser?.platformRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return true;
  }

  const churchId = record.churchId?.trim();
  if (!churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = await userCanManageChurch(uid, email, churchId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return true;
}

/** Only allow deleting prior media that belongs to this entity prefix. */
function isAuthorizedReplaceUrl(
  replaceUrl: string,
  kind: StorageUploadKind,
  entityId: string
): boolean {
  const key = getStorageObjectKeyFromUrl(replaceUrl);
  if (!key) return false;

  const prefixes: Record<StorageUploadKind, string> = {
    onboarding: `onboarding/${entityId}/`,
    "organization-logo": `organizations/${entityId}/`,
    "church-logo": `churches/${entityId}/`,
    "church-cover": `churches/${entityId}/`,
    song: `songs/${entityId}/`,
    sermon: `sermons/${entityId}/`,
    article: `articles/${entityId}/`,
    event: `events/${entityId}/`,
    donation: `donations/${entityId}/`,
    book: `books/${entityId}/`,
  };

  const prefix = prefixes[kind];
  return Boolean(prefix && key.startsWith(prefix) && !key.includes(".."));
}

async function authorizeUpload(
  uid: string,
  email: string | undefined,
  kind: StorageUploadKind,
  entityId: string
): Promise<true | NextResponse> {
  if (kind === "onboarding") {
    if (entityId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return true;
  }

  if (kind === "organization-logo") {
    const org = await getOrganizationById(entityId);
    if (!org) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const appUser = await getAppUserByClerkId(uid);
    if (!appUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const orgRow = await getOrgMembershipRow(appUser.id, org.id);
    if (
      !orgRow ||
      orgRow.status !== "active" ||
      !roleMeetsMinimum(orgRow.role as "owner" | "org_admin", "org_admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return true;
  }

  let churchId: string | null = null;

  if (kind === "church-logo" || kind === "church-cover") {
    const church = await getChurchById(entityId);
    churchId = church?.id ?? null;
  } else if (kind === "song") {
    return authorizeContentUpload(uid, email, await getSongById(entityId));
  } else if (kind === "sermon") {
    return authorizeContentUpload(uid, email, await getSermonById(entityId));
  } else if (kind === "article") {
    return authorizeContentUpload(uid, email, await getArticleById(entityId));
  } else if (kind === "event") {
    return authorizeContentUpload(uid, email, await getEventById(entityId));
  } else if (kind === "donation") {
    return authorizeContentUpload(uid, email, await getDonationCampaignById(entityId));
  }

  if (!churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = await userCanManageChurch(uid, email, churchId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyBearerToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await rateLimitUploadRequest(decoded.uid);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const entityId = searchParams.get("songId")?.trim() ?? "";
    const scope = searchParams.get("scope");
    const replaceUrl = searchParams.get("replaceUrl");

    let type: "cover" | "audio";
    if (typeParam === "cover" || typeParam === "audio") {
      type = typeParam;
    } else {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'cover' or 'audio'" },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json({ error: "songId is required" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(entityId)) {
      return NextResponse.json({ error: "Invalid songId format" }, { status: 400 });
    }

    const kind = resolveKind(searchParams.get("kind"), type, scope);
    const authorized = await authorizeUpload(
      decoded.uid,
      decoded.email,
      kind,
      entityId
    );
    if (authorized instanceof NextResponse) {
      return authorized;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name || entityId;
    const claimedExt = getFileExtension(file.type, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    let ext = claimedExt;
    let safeContentType = file.type || "application/octet-stream";

    if (type === "cover") {
      if (file.size > MAX_IMAGE_SIZE || buffer.length > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Cover image must be 2 MB or smaller" },
          { status: 400 }
        );
      }
      const sniffed = sniffImageContentType(buffer);
      if (!sniffed) {
        return NextResponse.json(
          { error: "Cover must be a valid JPEG, PNG, WebP, GIF, or AVIF image" },
          { status: 400 }
        );
      }
      ext = sniffed.ext;
      safeContentType = sniffed.contentType;
    } else {
      const claimedAudio =
        file.type.startsWith("audio/") ||
        Boolean(claimedExt.match(/^(mp3|wav|m4a|ogg|webm|aac)$/));
      if (!claimedAudio || !looksLikeAudio(buffer)) {
        return NextResponse.json(
          { error: "Audio must be a valid audio file" },
          { status: 400 }
        );
      }
      if (file.size > MAX_AUDIO_SIZE || buffer.length > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: "Audio file must be 20 MB or smaller" },
          { status: 400 }
        );
      }
      ext = claimedExt.match(/^(mp3|wav|m4a|ogg|webm|aac)$/)
        ? claimedExt
        : "mp3";
      safeContentType = file.type.startsWith("audio/")
        ? file.type
        : "audio/mpeg";
    }

    const uploaded = await uploadPublicObject({
      kind,
      entityId,
      ext,
      body: buffer,
      contentType: safeContentType,
    });

    if (replaceUrl) {
      if (isAuthorizedReplaceUrl(replaceUrl, kind, entityId)) {
        await deleteStoredMediaUrls(replaceUrl);
      } else {
        console.warn(
          "[Upload] Ignored unauthorized replaceUrl for entity",
          entityId
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: uploaded.publicUrl,
      objectKey: uploaded.objectKey,
      fileName: uploaded.objectKey.split("/").pop(),
      size: buffer.length,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
