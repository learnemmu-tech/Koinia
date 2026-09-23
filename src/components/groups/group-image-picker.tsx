"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { GroupAvatar } from "@/components/groups/group-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadGroupImageLocal } from "@/lib/local-upload";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function validateGroupImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}

type GroupImagePickerProps = {
  label?: string;
  previewUrl: string | null;
  onPreviewUrlChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export function GroupImagePicker({
  label = "Group image",
  previewUrl,
  onPreviewUrlChange,
  onFileChange,
  disabled,
}: GroupImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function pickFile(file: File | null) {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    if (!file) {
      onFileChange(null);
      onPreviewUrlChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const error = validateGroupImageFile(file);
    if (error) {
      toast.error(error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const next = URL.createObjectURL(file);
    setObjectUrl(next);
    onFileChange(file);
    onPreviewUrlChange(next);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={cn(
            "relative flex size-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E6E8EC] bg-[#F6F7FB] text-[#2D2F6F]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2F6F]/30"
          )}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label={previewUrl ? "Change group image" : "Upload group image"}
        >
          {previewUrl ?
            <GroupAvatar
              imageUrl={previewUrl}
              name="Group"
              className="size-[4.5rem] rounded-2xl"
            />
          : <Plus className="size-6" aria-hidden />}
        </button>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-[#0F172A]">
            {previewUrl ? "Group image" : "Upload group image"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP · Optional · 2 MB max
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {previewUrl ? "Change image" : "Add image"}
            </Button>
            {previewUrl ?
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-muted-foreground"
                disabled={disabled}
                onClick={() => pickFile(null)}
              >
                Remove
              </Button>
            : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export async function persistGroupImage(input: {
  groupId: string;
  file: File;
  token: string;
  replaceUrl?: string | null;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", input.file);
  return uploadGroupImageLocal(
    input.groupId,
    formData,
    input.token,
    input.replaceUrl ?? undefined,
    input.onProgress
  );
}

export function GroupImageUploadStatus({
  uploading,
  error,
}: {
  uploading: boolean;
  error?: string | null;
}) {
  if (uploading) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Uploading image…
      </p>
    );
  }
  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }
  return null;
}
