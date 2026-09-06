"use client";

import { compressShortCoverIfNeeded } from "@/lib/compress-short-image";

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    video.onloadeddata = () => resolve(video);
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video for poster."));
    };
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Could not seek video for poster."));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

/**
 * Grabs a JPEG poster from a local video file. Returns null if the browser
 * cannot decode the codec — publishing should continue without a poster.
 */
export async function extractShortPosterFrame(file: File): Promise<File | null> {
  let objectUrl: string | null = null;

  try {
    const video = await loadVideo(file);
    objectUrl = video.src;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTo =
      duration > 1 ? Math.min(1, duration * 0.15) : Math.max(0, duration * 0.25);
    await seekVideo(video, seekTo);

    const maxEdge = 1440;
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight, 1));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    if (width < 2 || height < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob || blob.size < 32) return null;

    const raw = new File([blob], "short-poster.jpg", { type: "image/jpeg" });
    return compressShortCoverIfNeeded(raw);
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
