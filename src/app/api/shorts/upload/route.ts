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
import { deleteStoredMediaUrls, uploadShortObject } from "@/lib/supabase-storage";

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

export async function POST(request: NextRequest) {
  try {
    const verified = await verifyBearerToken(request);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get("shortId")?.trim() ?? "";
    const slot = searchParams.get("slot") === "thumbnail" ? "thumbnail" : "video";

    if (!shortId || !/^[a-zA-Z0-9-]+$/.test(shortId)) {
      return NextResponse.json({ error: "Invalid shortId" }, { status: 400 });
    }

    const short = await getShortById(shortId);
    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    const appUser = await getAppUserByClerkId(verified.uid);
    if (!appUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = short.userId === appUser.id;
    const isAdmin = await userCanManageChurch(
      verified.uid,
      verified.email,
      short.churchId
    );
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = await userCanAccessChurchContent(
      verified.uid,
      verified.email,
      short.churchId
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
              "Upload payload was too large or incomplete. Try a smaller video (under 100 MB) and retry.",
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

    const ext = getExtension(file.type, file.name);

    if (slot === "video") {
      const isVideo =
        file.type.startsWith("video/") || VIDEO_EXTENSIONS.has(ext);
      if (!isVideo) {
        return NextResponse.json(
          { error: "Please upload a valid video file (MP4, WebM, MOV)." },
          { status: 400 }
        );
      }
      if (file.size > MAX_SHORT_VIDEO_BYTES) {
        return NextResponse.json(
          { error: "Video must be 50 MB or smaller." },
          { status: 400 }
        );
      }
    } else {
      const isImage =
        IMAGE_MIME_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(ext);
      if (!isImage) {
        return NextResponse.json(
          { error: "Cover image must be JPG, PNG, or WebP." },
          { status: 400 }
        );
      }
      if (file.size > MAX_SHORT_THUMBNAIL_BYTES) {
        return NextResponse.json(
          { error: "Cover image must be 2 MB or smaller." },
          { status: 400 }
        );
      }
    }

    const replaceUrl =
      slot === "video" ? short.videoUrl : short.thumbnailUrl;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadShortObject({
      churchId: short.churchId,
      shortId: short.id,
      slot,
      ext,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    if (replaceUrl && replaceUrl !== uploaded.publicUrl) {
      await deleteStoredMediaUrls(replaceUrl);
    }

    if (slot === "thumbnail") {
      await setShortThumbnailUrl(short.id, uploaded.publicUrl);
    }

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
