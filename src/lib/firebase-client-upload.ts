"use client";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { clientStorageBucket, storage } from "./firebase";
import {
  getGsUrl,
  getSongStoragePath,
  getStorageRestBaseUrl,
} from "./firebase-storage-config";
import { storageLog } from "./firebase-storage-logger";

export type UploadProgressCallback = (percent: number) => void;

/**
 * Client-side upload (requires Storage rules + correct bucket + bucket CORS).
 * Prefer uploadSongFileServer() from the admin panel to avoid browser CORS.
 */
export async function uploadSongFile(
  songId: string,
  fileType: "cover" | "audio",
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const path = getSongStoragePath(songId, fileType);
  const gsUrl = getGsUrl(clientStorageBucket);

  storageLog.uploadStart("Starting client upload", {
    songId,
    fileType,
    path,
    bucket: clientStorageBucket,
    gsUrl,
    restApiBase: getStorageRestBaseUrl(clientStorageBucket),
    fileSize: file.size,
    contentType: file.type,
  });

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  try {
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          storageLog.uploadProgress("Client upload progress", {
            songId,
            fileType,
            percent,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state,
          });
          onProgress?.(percent);
        },
        (error) => {
          storageLog.error("Client upload task failed", error, {
            songId,
            fileType,
            path,
            bucket: clientStorageBucket,
            hint:
              "CORS errors usually mean the bucket name is wrong, Storage is not enabled, or rules block the request. Use server upload instead.",
          });
          reject(error);
        },
        () => {
          storageLog.uploadSuccess("Client upload bytes complete", {
            songId,
            fileType,
            path,
          });
          resolve();
        }
      );
    });

    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

    storageLog.downloadUrl("Client download URL resolved", {
      songId,
      fileType,
      path,
      urlPreview: downloadUrl.slice(0, 120) + "...",
    });

    return downloadUrl;
  } catch (error) {
    storageLog.error("Client upload failed", error, {
      songId,
      fileType,
      path,
      bucket: clientStorageBucket,
    });
    throw error;
  }
}
