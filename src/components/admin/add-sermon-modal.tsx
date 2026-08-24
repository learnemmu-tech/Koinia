"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import type { FirebaseSermon } from "@/types/firebase-sermon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { createSermon, updateSermon } from "@/lib/firebase-sermon-queries";
import {
  isValidAudioUrl,
  isValidYouTubeUrl,
} from "@/lib/media-url-validation";
import { notifyIfNewlyPublished } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";

const sermonSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    scriptureReference: z.string().min(1, "Scripture reference is required"),
    speaker: z.string().min(1, "Speaker / Pastor is required"),
    shortDescription: z.string().min(1, "Short description is required"),
    content: z.string().min(1, "Sermon content is required"),
    tags: z.string().optional(),
    youtubeUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    isPublished: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const youtube = values.youtubeUrl?.trim() ?? "";
    const audio = values.audioUrl?.trim() ?? "";

    if (youtube && !isValidYouTubeUrl(youtube)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid YouTube URL (youtube.com or youtu.be)",
        path: ["youtubeUrl"],
      });
    }

    if (audio && !isValidAudioUrl(audio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid audio URL (http, https, or /uploads/...)",
        path: ["audioUrl"],
      });
    }
  });

type SermonFormValues = z.infer<typeof sermonSchema>;

type AddSermonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialSermon?: FirebaseSermon | null;
  churchId: string;
};

function parseTags(tagsInput?: string): string[] {
  if (!tagsInput?.trim()) return [];
  return tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function tagsToInput(tags?: string[]): string {
  return tags?.join(", ") ?? "";
}

function buildSermonPayload(values: SermonFormValues) {
  return {
    title: values.title.trim(),
    subtitle: values.subtitle?.trim() || undefined,
    scriptureReference: values.scriptureReference.trim(),
    speaker: values.speaker.trim(),
    shortDescription: values.shortDescription.trim(),
    content: values.content.trim(),
    tags: parseTags(values.tags),
    youtubeUrl: values.youtubeUrl?.trim() || undefined,
    audioUrl: values.audioUrl?.trim() || undefined,
    isPublished: values.isPublished,
  };
}

export function AddSermonModal({
  isOpen,
  onClose,
  onSave,
  initialSermon,
  churchId,
}: AddSermonModalProps) {
  const { user, authUser } = useFirebaseAuth();
  const { invalidateSermons } = useInvalidateAdminQueries();
  const tenantFields = useTenantNotifyFields();
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      scriptureReference: "",
      speaker: "",
      shortDescription: "",
      content: "",
      tags: "",
      youtubeUrl: "",
      audioUrl: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (initialSermon) {
      form.reset({
        title: initialSermon.title,
        subtitle: initialSermon.subtitle ?? "",
        scriptureReference: initialSermon.scriptureReference,
        speaker: initialSermon.speaker,
        shortDescription: initialSermon.shortDescription,
        content: initialSermon.content,
        tags: tagsToInput(initialSermon.tags),
        youtubeUrl: initialSermon.youtubeUrl ?? "",
        audioUrl: initialSermon.audioUrl ?? "",
        isPublished: initialSermon.isPublished,
      });
      setCoverPreview(initialSermon.coverImage ?? "");
    } else {
      form.reset({
        title: "",
        subtitle: "",
        scriptureReference: "",
        speaker: "",
        shortDescription: "",
        content: "",
        tags: "",
        youtubeUrl: "",
        audioUrl: "",
        isPublished: false,
      });
      setCoverPreview("");
    }
    setCoverFile(undefined);
    setUploadProgress(0);
  }, [initialSermon, isOpen, form]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: SermonFormValues) {
    if (coverFile && validateImageFile(coverFile)) {
      toast.error(validateImageFile(coverFile)!);
      return;
    }

    if (!coverFile && !coverPreview.trim()) {
      toast.error("Cover image is required");
      return;
    }

    const createdBy =
      authUser?.email ?? authUser?.displayName ?? authUser?.uid ?? "admin";
    const payload = buildSermonPayload(values);

    setLoading(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error("You must be signed in to upload files.");
        return;
      }

      if (initialSermon) {
        await updateSermon(initialSermon.id, payload);

        let coverImageUrl = initialSermon.coverImage ?? "";
        if (coverFile) {
          const fd = new FormData();
          fd.append("file", coverFile);
          const url = await uploadSongFileLocal(
            initialSermon.id,
            "cover",
            fd,
            (p) => setUploadProgress(p),
            idToken
          );
          coverImageUrl = url;
          await updateSermon(initialSermon.id, { coverImage: url });
        }

        await notifyIfNewlyPublished({
          type: "sermon",
          contentId: initialSermon.id,
          contentTitle: payload.title,
          image: coverImageUrl,
          isPublished: payload.isPublished,
          wasPublished: initialSermon.isPublished,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Sermon updated successfully");
      } else {
        const sermonId = await createSermon({
          ...payload,
          churchId,
          coverImage: "",
          createdBy,
        });

        let coverImageUrl = "";
        if (coverFile) {
          const fd = new FormData();
          fd.append("file", coverFile);
          const url = await uploadSongFileLocal(
            sermonId,
            "cover",
            fd,
            (p) => setUploadProgress(p),
            idToken
          );
          coverImageUrl = url;
          await updateSermon(sermonId, { coverImage: url });
        }

        await notifyIfNewlyPublished({
          type: "sermon",
          contentId: sermonId,
          contentTitle: payload.title,
          image: coverImageUrl,
          isPublished: payload.isPublished,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Sermon added successfully");
      }

      await invalidateSermons();
      onSave();
      form.reset();
      setCoverFile(undefined);
      setCoverPreview("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save sermon");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialSermon ? "Edit Sermon" : "Add Sermon"}</DialogTitle>
          <DialogDescription>
            {initialSermon
              ? "Update sermon details, media links, and cover image"
              : `Publish a new sermon to ${siteConfig.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Sermon Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Sermon title" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional subtitle" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scriptureReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scripture Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="John 3:16" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speaker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speaker / Pastor</FormLabel>
                      <FormControl>
                        <Input placeholder="Pastor name" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary for cards and search..."
                          rows={3}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sermon Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full sermon notes or transcript..."
                          rows={8}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="faith, grace, salvation"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Comma-separated tags</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audio URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/sermon.mp3"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Required · Max {MAX_IMAGE_SIZE_LABEL}
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
                          setCoverPreview(initialSermon?.coverImage ?? "");
                          setCoverFile(undefined);
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
                      accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                {uploadProgress > 0 ? (
                  <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
                ) : null}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Publish</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Make this sermon visible on the home page
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Sermon"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
