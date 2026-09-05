import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
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
import { deleteStoredMediaUrls, uploadPublicObject } from "@/lib/supabase-storage";
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
    churchId = (await getSongById(entityId))?.churchId ?? null;
  } else if (kind === "sermon") {
    churchId = (await getSermonById(entityId))?.churchId ?? null;
  } else if (kind === "article") {
    churchId = (await getArticleById(entityId))?.churchId ?? null;
  } else if (kind === "event") {
    churchId = (await getEventById(entityId))?.churchId ?? null;
  } else if (kind === "donation") {
    churchId = (await getDonationCampaignById(entityId))?.churchId ?? null;
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
    const ext = getFileExtension(file.type, fileName);

    if (type === "cover") {
      const isValidImage =
        file.type.startsWith("image/") ||
        Boolean(ext.match(/^(jpg|jpeg|png|webp|gif|avif)$/));
      if (!isValidImage) {
        return NextResponse.json(
          { error: "Cover must be an image file" },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Cover image must be 2 MB or smaller" },
          { status: 400 }
        );
      }
    } else {
      const isValidAudio =
        file.type.startsWith("audio/") ||
        Boolean(ext.match(/^(mp3|wav|m4a|ogg|webm|aac)$/));
      if (!isValidAudio) {
        return NextResponse.json(
          { error: "Audio must be an audio file" },
          { status: 400 }
        );
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: "Audio file must be 20 MB or smaller" },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadPublicObject({
      kind,
      entityId,
      ext,
      body: buffer,
      contentType: file.type,
    });

    if (replaceUrl) {
      await deleteStoredMediaUrls(replaceUrl);
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
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
