/**
 * Local file upload handler - replaces Firebase Storage upload
 * Stores files in /public/uploads/{images,audio}
 */

type UploadResponse = {
  success: boolean;
  url: string;
  fileName: string;
  size: number;
};

type UploadError = {
  error: string;
  details?: string;
};

export async function uploadOnboardingLogoLocal(
  userId: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  idToken?: string
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("No file provided");
  }

  if (!idToken?.trim()) {
    throw new Error("You must be signed in to upload files.");
  }

  onProgress?.(10);

  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  onProgress?.(30);

  const response = await fetch(
    `/api/upload?type=cover&songId=${encodeURIComponent(userId)}&scope=onboarding`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: uploadFormData,
    }
  );

  onProgress?.(80);

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errorJson = (await response.json()) as UploadError;
      if (errorJson.error) {
        errorMessage = errorJson.details
          ? `${errorJson.error}: ${errorJson.details}`
          : errorJson.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as UploadResponse;
  onProgress?.(100);
  return data.url;
}

export async function uploadSongFileLocal(
  songId: string,
  fileType: "cover" | "audio",
  formData: FormData,
  onProgress?: (percent: number) => void,
  idToken?: string
): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("No file provided");
  }

  if (!idToken?.trim()) {
    throw new Error("You must be signed in to upload files.");
  }

  onProgress?.(10);

  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  onProgress?.(30);

  try {
    const response = await fetch(`/api/upload?type=${fileType}&songId=${songId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: uploadFormData,
    });

    onProgress?.(80);

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorJson = (await response.json()) as UploadError;
        if (errorJson.error) {
          errorMessage = errorJson.details
            ? `${errorJson.error}: ${errorJson.details}`
            : errorJson.error;
        }
      } catch (jsonError) {
        console.error("[LocalUpload] Failed to parse error response", jsonError);
      }
      console.error(`[LocalUpload] Upload failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as UploadResponse;
    onProgress?.(100);
    return data.url;
  } catch (error) {
    console.error(`[LocalUpload] Error uploading ${fileType}:`, error);
    throw error;
  }
}
