import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { uploadSongFileServer } from "@/lib/firebase-storage-upload";
import { getAdminDb, getAdminStorageBucketName, isAdminConfigured } from "@/lib/firebase-admin";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import { roleMeetsMinimum } from "@/types/membership";

/**
 * Upload handler for local file storage
 * POST /api/upload?type=cover|audio&songId=<id>
 * 
 * Stores files in:
 * - Images: /public/uploads/images/<songId>.<ext>
 * - Audio: /public/uploads/audio/<songId>.<ext>
 */

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB

function getFileExtension(mimeType: string, fileName: string): string {
  const types: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
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
  if (extFromType) {
    return extFromType;
  }

  const extFromName = fileName.split(".").pop()?.toLowerCase();
  if (extFromName) {
    return extFromName;
  }

  return "bin";
}

async function verifyUploadAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  const { getAuth } = await import("firebase-admin/auth");
  const decoded = await getAuth().verifyIdToken(token);

  if (scope === "onboarding") {
    return { uid: decoded.uid };
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const organizationId = String(userSnap.data()?.organizationId ?? "").trim();

  if (!organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const membership = await getMembershipForUser(organizationId, decoded.uid);
  if (
    !membership ||
    membership.status !== "active" ||
    !roleMeetsMinimum(membership.role, "church_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { uid: decoded.uid };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUploadAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type"); // "cover" or "audio"
    const songId = searchParams.get("songId");

    // Type validation with proper type narrowing
    let type: "cover" | "audio";
    if (typeParam === "cover" || typeParam === "audio") {
      type = typeParam;
    } else {
      console.error("[Upload] Invalid type:", typeParam);
      return NextResponse.json(
        { error: "Invalid file type. Must be 'cover' or 'audio'" },
        { status: 400 }
      );
    }

    if (!songId) {
      console.error("[Upload] Missing songId");
      return NextResponse.json(
        { error: "songId is required" },
        { status: 400 }
      );
    }

    // Validate songId format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9\-_]+$/.test(songId)) {
      console.error("[Upload] Invalid songId format:", songId);
      return NextResponse.json(
        { error: "Invalid songId format" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("[Upload] No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    // File type validation
    const fileName = file.name || `${songId}`;
    const ext = getFileExtension(file.type, fileName);

    if (type === "cover") {
      const isValidImage = file.type.startsWith("image/") || ext.match(/^(jpg|jpeg|png|webp|gif|avif)$/);
      if (!isValidImage) {
        console.error(`[Upload] Invalid image type: ${file.type} / ${fileName}`);
        return NextResponse.json(
          { error: "Cover must be an image file" },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        console.error(`[Upload] Image too large: ${file.size} > ${MAX_IMAGE_SIZE}`);
        return NextResponse.json(
          { error: "Cover image must be 2 MB or smaller" },
          { status: 400 }
        );
      }
    } else if (type === "audio") {
      const isValidAudio = file.type.startsWith("audio/") || ext.match(/^(mp3|wav|m4a|ogg|webm|aac)$/);
      if (!isValidAudio) {
        console.error(`[Upload] Invalid audio type: ${file.type} / ${fileName}`);
        return NextResponse.json(
          { error: "Audio must be an audio file" },
          { status: 400 }
        );
      }
      if (file.size > MAX_AUDIO_SIZE) {
        console.error(`[Upload] Audio too large: ${file.size} > ${MAX_AUDIO_SIZE}`);
        return NextResponse.json(
          { error: "Audio file must be 20 MB or smaller" },
          { status: 400 }
        );
      }
    }

    // If Firebase Admin is configured, prefer Storage upload.
    if (isAdminConfigured()) {
      try {
        const bucketName = getAdminStorageBucketName();
        const url = await uploadSongFileServer(songId, type, formData);
        return NextResponse.json({
          success: true,
          url,
          fileName,
          size: file.size,
        });
      } catch (storageError) {
        console.warn("[Upload] Firebase Storage upload failed, falling back to local upload:", storageError);
      }
    }

    // Create directory if it doesn't exist
    const typeDir = join(UPLOAD_DIR, type);
    try {
      if (!existsSync(typeDir)) {
        await mkdir(typeDir, { recursive: true });
      }
    } catch (dirError) {
      console.error("[Upload] Failed to create directory:", dirError);
      throw dirError;
    }

    const fileNameWithExt = `${songId}.${ext}`;
    const filePath = join(typeDir, fileNameWithExt);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error("[Upload] Failed to write file:", writeError);
      throw writeError;
    }

    // Return relative URL that will work in browser
    const url = `/uploads/${type}/${fileNameWithExt}`;
    return NextResponse.json({
      success: true,
      url,
      fileName: fileNameWithExt,
      size: buffer.length,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
