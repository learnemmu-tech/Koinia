"use client";

import React from "react";
import { Clapperboard, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import {
  SHORT_CATEGORIES,
  MAX_SHORT_DURATION_SECONDS,
  MAX_SHORT_SOURCE_THUMBNAIL_BYTES,
  MAX_SHORT_SOURCE_VIDEO_BYTES,
  SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES,
  type ShortCategory,
  type ShortVisibility,
} from "@/types/video-short";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShortVideoPlayer } from "@/components/shorts/short-video-player";
import { compressShortCoverIfNeeded } from "@/lib/compress-short-image";
import { extractShortPosterFrame } from "@/lib/extract-short-poster";
import {
  compressShortVideoIfNeeded,
  type CompressShortVideoProgress,
} from "@/lib/compress-short-video";
import {
  createShortDraft,
  publishShort,
  uploadShortFile,
} from "@/lib/shorts-client";
import { cn } from "@/lib/utils";

type CreateShortSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  onPublished?: () => void;
};

type FieldErrors = {
  title?: string;
  video?: string;
  cover?: string;
};

const COVER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const fieldInputClass =
  "h-11 rounded-[10px] border-border bg-muted/30 text-sm shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0";

const fieldLabelClass = "text-xs font-medium text-muted-foreground";

function resolveCategory(topic: string): ShortCategory {
  const trimmed = topic.trim();
  if (!trimmed) return "Other";
  const match = SHORT_CATEGORIES.find(
    (item) => item.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? "Other";
}

/** Maps Title + Description (+ custom topic) into the existing caption API field. */
function buildCaption(title: string, description: string, topic: string): string {
  const titleText = title.trim();
  const descriptionText = description.trim();
  const topicText = topic.trim();
  const parts: string[] = [];

  if (titleText) parts.push(titleText);
  if (descriptionText) parts.push(descriptionText);

  let caption = parts.join("\n\n");

  if (
    topicText &&
    !SHORT_CATEGORIES.some((item) => item.toLowerCase() === topicText.toLowerCase())
  ) {
    caption = caption ? `${caption}\n\n— ${topicText}` : topicText;
  }

  return caption.slice(0, 500);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
      {children}
    </p>
  );
}

export function CreateShortSheet({
  open,
  onOpenChange,
  getToken,
  onPublished,
}: CreateShortSheetProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [visibility, setVisibility] = React.useState<ShortVisibility>("church");
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [posting, setPosting] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const [compressProgress, setCompressProgress] =
    React.useState<CompressShortVideoProgress | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  React.useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  function reset() {
    setTitle("");
    setDescription("");
    setTopic("");
    setVisibility("church");
    setVideoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverFile(null);
    setDuration(null);
    setUploadProgress(0);
    setCompressing(false);
    setCompressProgress(null);
    setErrors({});
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function applyVideoFile(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDuration(null);
    setErrors((prev) => ({ ...prev, video: undefined }));
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
      return;
    }

    if (file.size > MAX_SHORT_SOURCE_VIDEO_BYTES) {
      toast.error("Video must be 400 MB or smaller.");
      return;
    }

    if (
      file.type === "video/quicktime" ||
      file.name.toLowerCase().endsWith(".mov") ||
      file.type.includes("hevc")
    ) {
      toast.message(
        "Some iPhone videos use HEVC/MOV. If playback fails in a browser, export as MP4 (H.264)."
      );
    }

    setCompressing(true);
    setCompressProgress({ phase: "loading", percent: 0 });

    try {
      const originalMb = (file.size / (1024 * 1024)).toFixed(1);
      const processed = await compressShortVideoIfNeeded(file, setCompressProgress);

      if (processed.size < file.size) {
        toast.success(
          `Video compressed from ${originalMb} MB to ${(processed.size / (1024 * 1024)).toFixed(1)} MB for upload.`
        );
      }

      applyVideoFile(processed);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not prepare video for upload."
      );
      removeVideo();
    } finally {
      setCompressing(false);
      setCompressProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!COVER_MIME_TYPES.has(file.type)) {
      toast.error("Cover image must be JPG, PNG, or WebP.");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_SHORT_SOURCE_THUMBNAIL_BYTES) {
      toast.error("Cover image must be 20 MB or smaller.");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    void (async () => {
      try {
        const originalMb = (file.size / (1024 * 1024)).toFixed(1);
        const processed = await compressShortCoverIfNeeded(file);
        if (processed.size < file.size) {
          toast.success(
            `Cover compressed from ${originalMb} MB to ${(processed.size / (1024 * 1024)).toFixed(1)} MB.`
          );
        }
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        setCoverFile(processed);
        setCoverPreviewUrl(URL.createObjectURL(processed));
        setErrors((prev) => ({ ...prev, cover: undefined }));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not prepare cover image."
        );
        if (coverInputRef.current) coverInputRef.current.value = "";
      }
    })();
  }

  function removeCover() {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function removeVideo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setVideoFile(null);
    setDuration(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validateForm(): FieldErrors {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = "Please enter a title.";
    if (!videoFile || !previewUrl) next.video = "Choose a video to continue.";
    return next;
  }

  async function handlePublish() {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.video) toast.error(nextErrors.video);
      return;
    }

    if (duration != null && duration > MAX_SHORT_DURATION_SECONDS) {
      toast.error(`Shorts must be ${MAX_SHORT_DURATION_SECONDS} seconds or less.`);
      return;
    }

    const requireToken = async () => {
      const next = await getToken(true);
      if (!next) {
        throw new Error("Sign in to post a Short.");
      }
      return next;
    };

    const caption = buildCaption(title, description, topic);
    const category = resolveCategory(topic);

    setPosting(true);
    setUploadProgress(5);
    try {
      let fileToUpload = videoFile!;
      if (fileToUpload.size > SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES) {
        setCompressing(true);
        setCompressProgress({ phase: "compressing", percent: 0 });
        fileToUpload = await compressShortVideoIfNeeded(fileToUpload, setCompressProgress);
        applyVideoFile(fileToUpload);
        setCompressing(false);
        setCompressProgress(null);
      }

      let coverToUpload = coverFile;
      const usedCustomCover = Boolean(coverToUpload);
      if (coverToUpload) {
        coverToUpload = await compressShortCoverIfNeeded(coverToUpload);
        setCoverFile(coverToUpload);
      }

      // No custom cover: grab a poster frame while the video is uploading.
      const posterPromise =
        usedCustomCover ? null : extractShortPosterFrame(fileToUpload);

      const draft = await createShortDraft(
        { caption, category, visibility },
        await requireToken()
      );
      setUploadProgress(25);

      const videoUrl = await uploadShortFile(
        draft.id,
        "video",
        fileToUpload,
        await requireToken(),
        setUploadProgress
      );

      if (posterPromise) {
        coverToUpload = await posterPromise;
      }

      let thumbnailUrl: string | null = null;
      if (coverToUpload) {
        try {
          thumbnailUrl = await uploadShortFile(
            draft.id,
            "thumbnail",
            coverToUpload,
            await requireToken()
          );
          if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
          setCoverPreviewUrl(thumbnailUrl);
        } catch (error) {
          if (usedCustomCover) {
            throw new Error(
              error instanceof Error
                ? `Cover image upload failed: ${error.message}`
                : "Cover image upload failed. Please try again."
            );
          }
        }
      }

      await publishShort(
        draft.id,
        {
          videoUrl,
          thumbnailUrl,
          duration: duration ?? undefined,
          caption,
          category,
          visibility,
        },
        await requireToken()
      );

      toast.success("Short published!");
      reset();
      onOpenChange(false);
      onPublished?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish Short.");
    } finally {
      setPosting(false);
      setCompressing(false);
      setCompressProgress(null);
      setUploadProgress(0);
    }
  }

  const postingLabel =
    compressing ?
      compressProgress?.phase === "loading" ?
        "Preparing compressor…"
      : `Compressing… ${compressProgress?.percent ?? 0}%`
    : uploadProgress > 0 && uploadProgress < 90 ? "Uploading…"
    : "Posting…";

  const busy = posting || compressing;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          "inset-x-auto bottom-0 left-1/2 flex h-auto max-h-[min(92vh,860px)] w-[min(calc(100%-1.5rem),800px)] -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-t-2xl border border-border p-0 shadow-xl",
          "md:bottom-auto md:top-1/2 md:max-h-[min(88vh,820px)] md:-translate-y-1/2 md:rounded-2xl",
          "[&>button.absolute]:hidden"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Create a Short
            </SheetTitle>
            <SheetDescription className="text-[13px] leading-snug text-muted-foreground">
              Share a moment of faith, worship, or encouragement.
            </SheetDescription>
          </SheetHeader>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="app-interactive flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover-hover:hover:bg-muted/60 hover-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,35%)_minmax(0,65%)] md:gap-8">
            {/* Video preview column */}
            <div className="mx-auto w-full max-w-[250px] md:mx-0 md:max-w-[260px]">
              <div className="relative rounded-[14px] border border-border/60 bg-muted/15 p-2.5">
                {compressing ?
                  <div className="flex aspect-[9/16] flex-col items-center justify-center gap-3 rounded-[12px] bg-muted/30 px-4 text-center">
                    <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {compressProgress?.phase === "loading" ?
                          "Preparing…"
                        : "Compressing video…"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Large videos are optimized to fit the 50 MB upload limit.
                        {compressProgress?.phase === "compressing" ?
                          ` ${compressProgress.percent}%`
                        : null}
                      </p>
                    </div>
                  </div>
                : previewUrl ?
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-[12px]">
                      <ShortVideoPlayer
                        src={previewUrl}
                        poster={coverPreviewUrl}
                        active
                        onDuration={setDuration}
                        className="aspect-[9/16] w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      {duration != null ?
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {duration}s
                          {duration > MAX_SHORT_DURATION_SECONDS ?
                            ` · max ${MAX_SHORT_DURATION_SECONDS}s`
                          : null}
                        </p>
                      : <span />}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={busy}
                          className="app-interactive inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover-hover:hover:bg-muted/50 hover-hover:hover:text-foreground"
                        >
                          <RefreshCw className="size-3" />
                          Replace
                        </button>
                        <button
                          type="button"
                          aria-label="Remove video"
                          onClick={removeVideo}
                          disabled={busy}
                          className="app-interactive inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover-hover:hover:bg-muted/50 hover-hover:hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                : <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="app-interactive flex aspect-[9/16] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-border/70 bg-muted/20 px-4 text-center transition-colors hover-hover:hover:border-border hover-hover:hover:bg-muted/30 active:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                      <Plus className="size-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Choose a video
                    </span>
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      MP4, WebM · up to 400 MB (auto-compressed over 50 MB)
                    </span>
                  </button>
                }
                <input
                  ref={fileInputRef}
                  id="short-video-file"
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
              {errors.video ?
                <p className="mt-2 text-center text-xs text-destructive md:text-left">
                  {errors.video}
                </p>
              : null}
            </div>

            {/* Form column */}
            <div className="flex min-w-0 flex-col">
              <div className="space-y-[18px]">
                <div className="space-y-3.5">
                  <SectionLabel>Content</SectionLabel>

                  <div className="space-y-1.5">
                    <Label className={fieldLabelClass}>Cover Image</Label>
                    <div className="flex items-start gap-3">
                      {coverPreviewUrl ?
                        <div className="flex items-start gap-2">
                          <div className="relative w-[92px] shrink-0 overflow-hidden rounded-[10px] border border-border/60">
                            <img
                              src={coverPreviewUrl}
                              alt="Cover preview"
                              className="aspect-[9/16] w-full object-cover"
                            />
                            <button
                              type="button"
                              aria-label="Remove cover image"
                              onClick={removeCover}
                              disabled={busy}
                              className="app-interactive absolute right-1 top-1 flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground backdrop-blur-sm"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={busy}
                            className="app-interactive mt-1 text-xs font-medium text-muted-foreground hover-hover:hover:text-foreground"
                          >
                            Replace
                          </button>
                        </div>
                      : <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={busy}
                          className="app-interactive flex h-[118px] w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border/70 bg-muted/20 px-3 text-center transition-colors hover-hover:hover:border-border hover-hover:hover:bg-muted/30 active:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Plus className="size-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            Upload cover image
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            JPG, PNG or WebP · auto-compressed over 2 MB
                          </span>
                        </button>
                      }
                    </div>
                    <input
                      ref={coverInputRef}
                      id="short-cover-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleCoverChange}
                    />
                    {errors.cover ?
                      <p className="text-xs text-destructive">{errors.cover}</p>
                    : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="short-title" className={fieldLabelClass}>
                      Title
                    </Label>
                    <Input
                      id="short-title"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        if (errors.title) {
                          setErrors((prev) => ({ ...prev, title: undefined }));
                        }
                      }}
                      placeholder="Give your Short a title..."
                      maxLength={120}
                      className={fieldInputClass}
                      aria-invalid={Boolean(errors.title)}
                    />
                    {errors.title ?
                      <p className="text-xs text-destructive">{errors.title}</p>
                    : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="short-description" className={fieldLabelClass}>
                      Description
                    </Label>
                    <Textarea
                      id="short-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Tell people what this Short is about..."
                      maxLength={400}
                      rows={4}
                      className={cn(
                        fieldInputClass,
                        "min-h-[108px] max-h-[120px] resize-none py-2.5 leading-relaxed"
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="short-topic" className={fieldLabelClass}>
                      Topic
                    </Label>
                    <Input
                      id="short-topic"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="e.g. Prayer, Faith, Worship"
                      maxLength={80}
                      className={fieldInputClass}
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <SectionLabel>Audience</SectionLabel>

                  <div className="space-y-1.5">
                    <Label htmlFor="short-visibility" className={fieldLabelClass}>
                      Visibility
                    </Label>
                    <Select
                      value={visibility}
                      onValueChange={(value) => setVisibility(value as ShortVisibility)}
                    >
                      <SelectTrigger
                        id="short-visibility"
                        className={cn(fieldInputClass, "w-full")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="church">Church members</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {(posting && uploadProgress > 0) || compressing ?
                <div className="mt-5 space-y-1.5">
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${compressing ? compressProgress?.percent ?? 8 : uploadProgress}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {postingLabel}
                    {!compressing && uploadProgress > 0 ? ` ${uploadProgress}%` : null}
                  </p>
                </div>
              : null}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={busy}
                  className="h-11 rounded-[10px] px-5 sm:h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={busy || !videoFile}
                  className="h-11 gap-2 rounded-[10px] px-5 sm:h-10"
                >
                  {busy ?
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {postingLabel}
                    </>
                  : <>
                      <Clapperboard className="size-4" aria-hidden />
                      Post Short
                    </>
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
