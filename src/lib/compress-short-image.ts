"use client";

import {
  MAX_SHORT_SOURCE_THUMBNAIL_BYTES,
  MAX_SHORT_THUMBNAIL_BYTES,
} from "@/types/video-short";

const MAX_EDGE = 1440;
const QUALITIES = [0.86, 0.74, 0.62, 0.5, 0.4];

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Could not read that image. Use JPG, PNG, or WebP."));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress the cover image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Shrinks large Short cover images in the browser so uploads stay under 2 MB.
 */
export async function compressShortCoverIfNeeded(file: File): Promise<File> {
  if (file.size > MAX_SHORT_SOURCE_THUMBNAIL_BYTES) {
    throw new Error(
      `Cover image must be ${formatMb(MAX_SHORT_SOURCE_THUMBNAIL_BYTES)} or smaller.`
    );
  }

  if (file.size <= MAX_SHORT_THUMBNAIL_BYTES) {
    return file;
  }

  const image = await decodeImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  let width = Math.max(1, Math.round(image.width * scale));
  let height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not compress the cover image in this browser.");
  }

  let best: Blob | null = null;

  for (let pass = 0; pass < 3; pass += 1) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    for (const quality of QUALITIES) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= MAX_SHORT_THUMBNAIL_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "cover";
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      }
    }

    width = Math.max(1, Math.round(width * 0.75));
    height = Math.max(1, Math.round(height * 0.75));
  }

  throw new Error(
    `Could not compress the cover below ${formatMb(MAX_SHORT_THUMBNAIL_BYTES)}. Try a simpler image.`
  );
}
