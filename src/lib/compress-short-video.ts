"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

import {
  MAX_SHORT_DURATION_SECONDS,
  SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES,
  SHORT_VIDEO_UPLOAD_TARGET_BYTES,
} from "@/types/video-short";

const FFMPEG_CORE_VERSION = "0.12.6";
const CORE_CDN = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

export type CompressShortVideoProgress = {
  phase: "loading" | "compressing";
  percent: number;
};

function fileExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ext.length <= 8 ? ext : "mp4";
}

async function loadFfmpeg(
  onProgress?: (progress: CompressShortVideoProgress) => void
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      onProgress?.({ phase: "loading", percent: 5 });
      const ffmpeg = new FFmpeg();

      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_CDN}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_CDN}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpegInstance = ffmpeg;
      onProgress?.({ phase: "loading", percent: 100 });
      return ffmpeg;
    })().catch((error) => {
      ffmpegLoadPromise = null;
      throw error;
    });
  }

  return ffmpegLoadPromise;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Could not read video duration."));
        return;
      }
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata."));
    };

    video.src = url;
  });
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses large Short videos in the browser so uploads fit Supabase Free (50 MB).
 * Returns the original file when already under the threshold.
 */
export async function compressShortVideoIfNeeded(
  file: File,
  onProgress?: (progress: CompressShortVideoProgress) => void
): Promise<File> {
  if (file.size <= SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  const duration = await readVideoDuration(file);
  if (duration > MAX_SHORT_DURATION_SECONDS) {
    throw new Error(
      `Shorts must be ${MAX_SHORT_DURATION_SECONDS} seconds or less. Your video is ${Math.round(duration)}s.`
    );
  }

  onProgress?.({ phase: "loading", percent: 0 });
  const ffmpeg = await loadFfmpeg(onProgress);

  const targetBytes = SHORT_VIDEO_UPLOAD_TARGET_BYTES;
  const targetBits = targetBytes * 8 * 0.88;
  const audioBitrate = 96_000;
  const videoBitrate = Math.max(
    350_000,
    Math.floor(targetBits / duration - audioBitrate)
  );
  const videoBitrateK = Math.max(350, Math.floor(videoBitrate / 1000));

  const inputName = `input.${fileExtension(file.name)}`;
  const outputName = "output.mp4";

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.({
      phase: "compressing",
      percent: Math.min(99, Math.round(progress * 100)),
    });
  };

  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      "scale='min(1080,iw)':-2:force_original_aspect_ratio=decrease",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-b:v",
      `${videoBitrateK}k`,
      "-maxrate",
      `${Math.floor(videoBitrateK * 1.1)}k`,
      "-bufsize",
      `${videoBitrateK * 2}k`,
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      "-fs",
      String(targetBytes),
      outputName,
    ]);

    const output = await ffmpeg.readFile(outputName);
    if (!(output instanceof Uint8Array) || output.byteLength === 0) {
      throw new Error("Compression produced an empty file.");
    }

    const blob = new Blob([output], { type: "video/mp4" });
    if (blob.size > SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES) {
      throw new Error(
        `Could not compress below ${formatMb(SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES)}. Try a shorter or lower-resolution video.`
      );
    }

    onProgress?.({ phase: "compressing", percent: 100 });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "short";
    return new File([blob], `${baseName}.mp4`, { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      // ignore cleanup errors
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      // ignore cleanup errors
    }
  }
}

export function shouldCompressShortVideo(file: File): boolean {
  return file.size > SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES;
}
