"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseSong, SongCategory } from "@/types/firebase-song";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addSong, updateSong } from "@/lib/firebase-queries";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { useSubscriptionOptional } from "@/context/subscription-context";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { notifyIfNewlyPublished } from "@/lib/notify-if-published";
import { SONG_CATEGORIES } from "@/types/firebase-song";
import { uploadSongFileLocal } from "@/lib/local-upload";
import {
  MAX_AUDIO_SIZE_LABEL,
  MAX_IMAGE_SIZE_LABEL,
  validateAudioFile,
  validateImageFile,
} from "@/lib/upload-limits";

type AddMusicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialSong?: FirebaseSong | null;
  churchId: string;
};

type SongFormData = {
  songTitle: string;
  alternateTitle: string;
  artist: string;
  category: SongCategory;
  originalLyrics: string;
  translationLyrics: string;
  scriptureReference: string;
  tags: string;
  featured: boolean;
  published: boolean;
  youtubeUrl: string;
};

type UploadProgress = {
  cover: number;
  audio: number;
};

const EMPTY_FORM: SongFormData = {
  songTitle: "",
  alternateTitle: "",
  artist: "",
  category: "Worship",
  originalLyrics: "",
  translationLyrics: "",
  scriptureReference: "",
  tags: "",
  featured: false,
  published: true,
  youtubeUrl: "",
};

function UploadProgressBar({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  if (percent <= 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function songToFormData(song: FirebaseSong): SongFormData {
  return {
    songTitle: song.songTitle || song.englishTitle || song.title || "",
    alternateTitle: song.alternateTitle ?? song.teluguTitle ?? "",
    artist: song.artist ?? "",
    category: song.category ?? "Worship",
    originalLyrics: song.originalLyrics || song.lyrics || "",
    translationLyrics:
      song.translationLyrics ?? song.transliteratedLyrics ?? "",
    scriptureReference: song.scriptureReference ?? "",
    tags: song.tags?.join(", ") ?? "",
    featured: song.featured ?? false,
    published: song.published !== false,
    youtubeUrl: song.youtubeUrl || "",
  };
}

export function AddMusicModal({
  isOpen,
  onClose,
  onSave,
  initialSong,
  churchId,
}: AddMusicModalProps) {
  const { user } = useFirebaseAuth();
  const { invalidateSongs } = useInvalidateAdminQueries();
  const subscription = useSubscriptionOptional();
  const tenantFields = useTenantNotifyFields();
  const [formData, setFormData] = useState<SongFormData>(EMPTY_FORM);
  const [files, setFiles] = useState<{ cover?: File; audio?: File }>({});
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    cover: 0,
    audio: 0,
  });

  useEffect(() => {
    if (initialSong) {
      setFormData(songToFormData(initialSong));
      setCoverPreview(initialSong.imageUrl || "");
    } else {
      setFormData(EMPTY_FORM);
      setCoverPreview("");
    }
    setFiles({});
    setUploadProgress({ cover: 0, audio: 0 });
  }, [initialSong, isOpen]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function isValidYouTubeUrl(url: string) {
    if (!url) return true;
    return /(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)/i.test(
      url.trim()
    );
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "audio"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error =
      type === "cover" ? validateImageFile(file) : validateAudioFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setFiles((prev) => ({ ...prev, [type]: file }));

    if (type === "cover") {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function uploadFile(
    songId: string,
    fileType: "cover" | "audio",
    file: File,
    idToken: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    onProgress?.(10);
    const fd = new FormData();
    fd.append("file", file);
    onProgress?.(30);
    return uploadSongFileLocal(songId, fileType, fd, (percent) => {
      onProgress?.(30 + percent * 0.7);
    }, idToken);
  }

  function buildSongPayload() {
    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      songTitle: formData.songTitle.trim(),
      alternateTitle: formData.alternateTitle.trim() || undefined,
      artist: formData.artist.trim() || undefined,
      category: formData.category,
      originalLyrics: formData.originalLyrics,
      translationLyrics: formData.translationLyrics.trim() || undefined,
      scriptureReference: formData.scriptureReference.trim() || undefined,
      tags,
      featured: formData.featured,
      published: formData.published,
      youtubeUrl: formData.youtubeUrl.trim() || undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.songTitle.trim()) {
      toast.error("Song title is required");
      return;
    }

    if (files.cover && validateImageFile(files.cover)) {
      toast.error(validateImageFile(files.cover)!);
      return;
    }

    if (files.audio && validateAudioFile(files.audio)) {
      toast.error(validateAudioFile(files.audio)!);
      return;
    }

    if (formData.youtubeUrl && !isValidYouTubeUrl(formData.youtubeUrl)) {
      toast.error("YouTube URL must be a valid youtube.com or youtu.be link");
      return;
    }

    if (!initialSong && subscription && !subscription.checkUsageLimit("songs")) {
      return;
    }

    setLoading(true);
    setUploadProgress({ cover: 0, audio: 0 });

    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error("You must be signed in to upload files.");
        return;
      }
      const payload = buildSongPayload();
      const wasPublished = initialSong?.published !== false;

      if (initialSong) {
        await updateSong(initialSong.id, payload);

        const mediaUpdates: { imageUrl?: string; audioUrl?: string } = {};
        if (files.cover) {
          mediaUpdates.imageUrl = await uploadFile(
            initialSong.id,
            "cover",
            files.cover,
            idToken,
            (p) => setUploadProgress((prev) => ({ ...prev, cover: p }))
          );
        }
        if (files.audio) {
          mediaUpdates.audioUrl = await uploadFile(
            initialSong.id,
            "audio",
            files.audio,
            idToken,
            (p) => setUploadProgress((prev) => ({ ...prev, audio: p }))
          );
        }
        if (Object.keys(mediaUpdates).length > 0) {
          await updateSong(initialSong.id, mediaUpdates);
        }

        if (payload.published && !wasPublished) {
          await notifyIfNewlyPublished({
            type: "song",
            contentId: initialSong.id,
            contentTitle: payload.songTitle,
            image: mediaUpdates.imageUrl ?? initialSong.imageUrl ?? "",
            isPublished: true,
            wasPublished,
            idToken,
            churchId: tenantFields.churchId ?? churchId,
            organizationId: tenantFields.organizationId,
          });
        }

        toast.success("Song updated successfully");
      } else {
        const songId = await addSong(tenantFields.churchId ?? churchId, {
          ...payload,
          imageUrl: "",
          audioUrl: "",
        }, {
          branchId: tenantFields.branchId,
          organizationIdFallback: tenantFields.organizationId,
        });

        const mediaUpdates: { imageUrl?: string; audioUrl?: string } = {};
        if (files.cover) {
          mediaUpdates.imageUrl = await uploadFile(
            songId,
            "cover",
            files.cover,
            idToken,
            (p) => setUploadProgress((prev) => ({ ...prev, cover: p }))
          );
        }
        if (files.audio) {
          mediaUpdates.audioUrl = await uploadFile(
            songId,
            "audio",
            files.audio,
            idToken,
            (p) => setUploadProgress((prev) => ({ ...prev, audio: p }))
          );
        }
        if (Object.keys(mediaUpdates).length > 0) {
          await updateSong(songId, mediaUpdates);
        }

        await notifyIfNewlyPublished({
          type: "song",
          contentId: songId,
          contentTitle: payload.songTitle,
          image: mediaUpdates.imageUrl ?? "",
          isPublished: payload.published,
          idToken,
          churchId: tenantFields.churchId ?? churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Song added successfully");
      }

      await invalidateSongs();
      onSave();
      setFormData(EMPTY_FORM);
      setFiles({});
      setCoverPreview("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save song");
    } finally {
      setLoading(false);
      setUploadProgress({ cover: 0, audio: 0 });
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialSong ? "Edit Song" : "Add New Song"}</DialogTitle>
          <DialogDescription>
            {initialSong
              ? "Update song details, media, lyrics, and publishing options."
              : "Add a worship song for your church or ministry library."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection
            title="Basic Information"
            description="Core details shown across the song library."
          >
            <div className="space-y-2">
              <Label htmlFor="songTitle">Song Title *</Label>
              <Input
                id="songTitle"
                name="songTitle"
                value={formData.songTitle}
                onChange={handleInputChange}
                placeholder="e.g. How Great Thou Art"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alternateTitle">Alternate Title</Label>
                <Input
                  id="alternateTitle"
                  name="alternateTitle"
                  value={formData.alternateTitle}
                  onChange={handleInputChange}
                  placeholder="Translation or local title"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artist">Artist / Worship Team</Label>
                <Input
                  id="artist"
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  placeholder="e.g. Hillsong Worship"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: SongCategory) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SONG_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection
            title="Media"
            description="Cover art, audio recording, and optional video."
          >
            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image</Label>
              <p className="text-xs text-muted-foreground">
                Max {MAX_IMAGE_SIZE_LABEL}
              </p>
              <div className="flex gap-4">
                {coverPreview ? (
                  <div className="relative h-20 w-20 shrink-0">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-full w-full rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(initialSong?.imageUrl ?? "");
                        setFiles((prev) => {
                          const next = { ...prev };
                          delete next.cover;
                          return next;
                        });
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 p-4 transition-colors hover:border-primary">
                  <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-medium">Click to upload</span>
                  <input
                    type="file"
                    id="cover"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/*"
                    onChange={(e) => handleFileChange(e, "cover")}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
              <UploadProgressBar label="Cover upload" percent={uploadProgress.cover} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">Audio File</Label>
              <p className="text-xs text-muted-foreground">
                Max {MAX_AUDIO_SIZE_LABEL}
              </p>
              {files.audio ? (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-muted p-2">
                  <span className="truncate text-sm">{files.audio.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => {
                        const next = { ...prev };
                        delete next.audio;
                        return next;
                      })
                    }
                    className="rounded-full p-1 hover:bg-destructive/20"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 p-4 transition-colors hover:border-primary">
                <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-medium">Click to upload</span>
                <input
                  type="file"
                  id="audio"
                  accept=".mp3,.wav,.m4a,audio/*"
                  onChange={(e) => handleFileChange(e, "audio")}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <UploadProgressBar label="Audio upload" percent={uploadProgress.audio} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
              <Input
                id="youtubeUrl"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                disabled={loading}
              />
            </div>
          </FormSection>

          <FormSection
            title="Lyrics"
            description="English lyrics and optional translated / transliterated lyrics."
          >
            <div className="space-y-2">
              <Label htmlFor="translationLyrics">English Lyrics</Label>
              <Textarea
                id="translationLyrics"
                name="translationLyrics"
                value={formData.translationLyrics}
                onChange={handleInputChange}
                placeholder="Enter English lyrics..."
                rows={5}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalLyrics">Translated Lyrics</Label>
              <Textarea
                id="originalLyrics"
                name="originalLyrics"
                value={formData.originalLyrics}
                onChange={handleInputChange}
                placeholder="Enter transliterated or translated lyrics..."
                rows={5}
                disabled={loading}
              />
            </div>
          </FormSection>

          <FormSection
            title="Publishing"
            description="Metadata and visibility for the public library."
          >
            <div className="space-y-2">
              <Label htmlFor="scriptureReference">Scripture Reference</Label>
              <Input
                id="scriptureReference"
                name="scriptureReference"
                value={formData.scriptureReference}
                onChange={handleInputChange}
                placeholder="e.g. Psalm 23:1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g. communion, revival, Sunday service"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-4 py-3">
              <div>
                <Label htmlFor="featured">Featured Song</Label>
                <p className="text-xs text-muted-foreground">
                  Highlight this song in featured areas.
                </p>
              </div>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, featured: checked }))
                }
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-4 py-3">
              <div>
                <Label htmlFor="published">Publish</Label>
                <p className="text-xs text-muted-foreground">
                  Make this song visible to the public library.
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, published: checked }))
                }
                disabled={loading}
              />
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress.cover > 0 || uploadProgress.audio > 0
                    ? "Uploading..."
                    : "Saving..."}
                </>
              ) : (
                "Save Song"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
