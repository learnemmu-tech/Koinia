"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import type { FirebaseArticle } from "@/types/firebase-article";
import { ARTICLE_CATEGORIES } from "@/types/firebase-article";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { createArticle, updateArticle } from "@/lib/firebase-article-queries";
import { isValidYouTubeUrl } from "@/lib/media-url-validation";
import { notifyIfNewlyPublished } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";

const articleSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    shortDescription: z.string().min(1, "Short description is required"),
    scriptureReference: z.string().optional(),
    content: z.string().min(1, "Full content is required"),
    author: z.string().min(1, "Author is required"),
    tags: z.string().optional(),
    youtubeUrl: z.string().optional(),
    featured: z.boolean(),
    isPublished: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const youtube = values.youtubeUrl?.trim() ?? "";
    if (youtube && !isValidYouTubeUrl(youtube)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid YouTube URL (youtube.com or youtu.be)",
        path: ["youtubeUrl"],
      });
    }
  });

type ArticleFormValues = z.infer<typeof articleSchema>;

type AddArticleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialArticle?: FirebaseArticle | null;
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

function buildArticlePayload(values: ArticleFormValues) {
  return {
    title: values.title.trim(),
    category: values.category.trim(),
    shortDescription: values.shortDescription.trim(),
    scriptureReference: values.scriptureReference?.trim() || undefined,
    content: values.content.trim(),
    author: values.author.trim(),
    tags: parseTags(values.tags),
    youtubeUrl: values.youtubeUrl?.trim() || undefined,
    featured: values.featured,
    isPublished: values.isPublished,
  };
}

export function AddArticleModal({
  isOpen,
  onClose,
  onSave,
  initialArticle,
  churchId,
}: AddArticleModalProps) {
  const { user, authUser } = useFirebaseAuth();
  const { invalidateArticles } = useInvalidateAdminQueries();
  const tenantFields = useTenantNotifyFields();
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      category: "Christian Living",
      shortDescription: "",
      scriptureReference: "",
      content: "",
      author: "",
      tags: "",
      youtubeUrl: "",
      featured: false,
      isPublished: false,
    },
  });

  useEffect(() => {
    if (initialArticle) {
      form.reset({
        title: initialArticle.title,
        category: initialArticle.category,
        shortDescription: initialArticle.shortDescription,
        scriptureReference: initialArticle.scriptureReference ?? "",
        content: initialArticle.content,
        author: initialArticle.author,
        tags: tagsToInput(initialArticle.tags),
        youtubeUrl: initialArticle.youtubeUrl ?? "",
        featured: initialArticle.featured,
        isPublished: initialArticle.isPublished,
      });
      setCoverPreview(initialArticle.coverImage ?? "");
    } else {
      form.reset({
        title: "",
        category: "Christian Living",
        shortDescription: "",
        scriptureReference: "",
        content: "",
        author: authUser?.displayName ?? "",
        tags: "",
        youtubeUrl: "",
        featured: false,
        isPublished: false,
      });
      setCoverPreview("");
    }
    setCoverFile(undefined);
    setUploadProgress(0);
  }, [initialArticle, isOpen, form, authUser?.displayName]);

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

  async function onSubmit(values: ArticleFormValues) {
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
    const payload = buildArticlePayload(values);

    setLoading(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error("You must be signed in to upload files.");
        return;
      }

      if (initialArticle) {
        await updateArticle(initialArticle.id, payload);

        let coverImageUrl = initialArticle.coverImage ?? "";
        if (coverFile) {
          const fd = new FormData();
          fd.append("file", coverFile);
          const url = await uploadSongFileLocal(
            initialArticle.id,
            "cover",
            fd,
            (p) => setUploadProgress(p),
            idToken
          );
          coverImageUrl = url;
          await updateArticle(initialArticle.id, { coverImage: url });
        }

        await notifyIfNewlyPublished({
          type: "article",
          contentId: initialArticle.id,
          contentTitle: payload.title,
          image: coverImageUrl,
          isPublished: payload.isPublished,
          wasPublished: initialArticle.isPublished,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Article updated successfully");
      } else {
        const articleId = await createArticle({
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
            articleId,
            "cover",
            fd,
            (p) => setUploadProgress(p),
            idToken
          );
          coverImageUrl = url;
          await updateArticle(articleId, { coverImage: url });
        }

        await notifyIfNewlyPublished({
          type: "article",
          contentId: articleId,
          contentTitle: payload.title,
          image: coverImageUrl,
          isPublished: payload.isPublished,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Article added successfully");
      }

      await invalidateArticles();
      onSave();
      form.reset();
      setCoverFile(undefined);
      setCoverPreview("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save article");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialArticle ? "Edit Article" : "Add Article"}</DialogTitle>
          <DialogDescription>
            {initialArticle
              ? "Update article content, media links, and cover image"
              : `Publish a new article to ${siteConfig.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Article title" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ARTICLE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Brief summary shown on cards..."
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
                  name="scriptureReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scripture Reference (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Psalm 23:1" disabled={loading} {...field} />
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
                      <FormLabel>Full Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write the full article content..."
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
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Author name" disabled={loading} {...field} />
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
                          placeholder="Prayer, Worship, Faith (comma separated)"
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
                          setCoverPreview(initialArticle?.coverImage ?? "");
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
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Featured Article</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Highlight this article for future homepage features
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

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Publish</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Make this article visible on the home page
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
                  "Save Article"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
