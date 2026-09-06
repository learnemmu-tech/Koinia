import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getShortById, setShortThumbnailUrl } from "@/lib/postgres/shorts";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";
import {
  MAX_SHORT_THUMBNAIL_BYTES,
  MAX_SHORT_VIDEO_BYTES,
} from "@/types/video-short";
import {
  createShortSignedUpload,
  deleteStoredMediaUrls,
  getPublicStorageUrl,
  isOwnedShortObjectKey,
  uploadShortObject,
} from "@/lib/supabase-storage";

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

/** Large video uploads may take time on slower connections. */
export const maxDuration = 120;

function getExtension(mimeType: string, fileName: string): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (map[mimeType]) return map[mimeType]!;
  const fromName = fileName.split(".").pop()?.toLowerCase();
  return fromName ?? "bin";
}

async function authorizeUpload(request: NextRequest, shortId: string) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!shortId || !/^[a-zA-Z0-9-]+$/.test(shortId)) {
    return { error: NextResponse.json({ error: "Invalid shortId" }, { status: 400 }) };
  }

  const short = await getShortById(shortId);
  if (!short) {
    return { error: NextResponse.json({ error: "Short not found" }, { status: 404 }) };
  }

  const appUser = await getAppUserByClerkId(verified.uid);
  if (!appUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isOwner = short.userId === appUser.id;
  const isAdmin = await userCanManageChurch(
    verified.uid,
    verified.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const allowed = await userCanAccessChurchContent(
    verified.uid,
    verified.email,
    short.churchId
  );
  if (!allowed) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { short };
}

function validateSlotFile(input: {
  slot: "video" | "thumbnail";
  mimeType: string;
  fileName: string;
  size: number;
}) {
  const ext = getExtension(input.mimeType, input.fileName);

  if (input.slot === "video") {
    const isVideo =
      input.mimeType.startsWith("video/") || VIDEO_EXTENSIONS.has(ext);
    if (!isVideo) {
      return { error: "Please upload a valid video file (MP4, WebM, or MOV)." };
    }
    if (input.size > MAX_SHORT_VIDEO_BYTES) {
      return { error: "Video must be 50 MB or smaller." };
    }
  } else {
    const isImage =
      IMAGE_MIME_TYPES.has(input.mimeType) || IMAGE_EXTENSIONS.has(ext);
    if (!isImage) {
      return { error: "Cover image must be JPG, PNG, or WebP." };
    }
    if (input.size > MAX_SHORT_THUMBNAIL_BYTES) {
      return { error: "Cover image must be 2 MB or smaller." };
    }
  }

  return { ext };
}

async function finalizeSlot(input: {
  short: NonNullable<Awaited<ReturnType<typeof getShortById>>>;
  slot: "video" | "thumbnail";
  publicUrl: string;
}) {
  const replaceUrl =
    input.slot === "video" ? input.short.videoUrl : input.short.thumbnailUrl;

  if (replaceUrl && replaceUrl !== input.publicUrl) {
    await deleteStoredMediaUrls(replaceUrl);
  }

  if (input.slot === "thumbnail") {
    await setShortThumbnailUrl(input.short.id, input.publicUrl);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get("shortId")?.trim() ?? "";
    const slot = searchParams.get("slot") === "thumbnail" ? "thumbnail" : "video";

    const auth = await authorizeUpload(request, shortId);
    if ("error" in auth) return auth.error;
    const { short } = auth;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as {
        action?: string;
        contentType?: string;
        fileName?: string;
        size?: number;
        objectKey?: string;
      } | null;

      if (body?.action === "complete") {
        const objectKey = body.objectKey?.trim() ?? "";
        if (
          !isOwnedShortObjectKey({
            objectKey,
            churchId: short.churchId,
            shortId: short.id,
            slot,
          })
        ) {
          return NextResponse.json({ error: "Invalid upload path." }, { status: 400 });
        }

        const publicUrl = getPublicStorageUrl(objectKey);
        await finalizeSlot({ short, slot, publicUrl });

        return NextResponse.json({
          success: true,
          url: publicUrl,
          objectKey,
        });
      }

      const mimeType = body?.contentType?.trim() ?? "";
      const fileName = body?.fileName?.trim() ?? "upload";
      const size = typeof body?.size === "number" ? body.size : 0;
      const validated = validateSlotFile({ slot, mimeType, fileName, size });
      if ("error" in validated && validated.error) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      const signed = await createShortSignedUpload({
        churchId: short.churchId,
        shortId: short.id,
        slot,
        ext: validated.ext!,
      });

      return NextResponse.json({
        success: true,
        mode: "signed",
        signedUrl: signed.signedUrl,
        token: signed.token,
        objectKey: signed.objectKey,
        publicUrl: signed.publicUrl,
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("FormData")) {
        return NextResponse.json(
          {
            error:
              "Upload payload was too large or incomplete. Try a smaller video (under 50 MB) and retry.",
          },
          { status: 413 }
        );
      }
      throw error;
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validated = validateSlotFile({
      slot,
      mimeType: file.type,
      fileName: file.name,
      size: file.size,
    });
    if ("error" in validated && validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadShortObject({
      churchId: short.churchId,
      shortId: short.id,
      slot,
      ext: validated.ext!,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    await finalizeSlot({
      short,
      slot,
      publicUrl: uploaded.publicUrl,
    });

    return NextResponse.json({
      success: true,
      url: uploaded.publicUrl,
      objectKey: uploaded.objectKey,
      size: buffer.length,
    });
  } catch (error) {
    console.error("[shorts/upload]", error);
    const message = error instanceof Error ? error.message : String(error);
    const isSizeError = /maximum allowed size|exceeds the Supabase Storage/i.test(
      message
    );
    return NextResponse.json(
      { error: message || "Upload failed" },
      { status: isSizeError ? 413 : 500 }
    );
  }
}
