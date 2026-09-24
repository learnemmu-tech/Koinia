"use client";

import React from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { SHORT_CATEGORIES, type ShortCategory } from "@/types/video-short";
import { parseChurchVideoUrl } from "@/lib/media-url-validation";
import { createChurchVideo } from "@/lib/videos-client";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTrialWriteMountGuard } from "@/components/subscription/trial-write-guard";

type AddVideoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  onSaved?: () => void;
  contentScope?: "organization" | "platform_public";
  churchId?: string;
};

const fieldInputClass =
  "h-11 rounded-[10px] border-border bg-muted/30 text-sm shadow-none";

export function AddVideoSheet({
  open,
  onOpenChange,
  getToken,
  onSaved,
  contentScope = "organization",
  churchId = "",
}: AddVideoSheetProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [externalUrl, setExternalUrl] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [category, setCategory] = React.useState<ShortCategory>("Other");
  const [tags, setTags] = React.useState("");
  const [published, setPublished] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  useTrialWriteMountGuard(
    { action: "create", resource: "video", contentScope },
    open,
    () => onOpenChange(false)
  );

  function reset() {
    setTitle("");
    setDescription("");
    setExternalUrl("");
    setThumbnailUrl("");
    setCategory("Other");
    setTags("");
    setPublished(true);
  }

  React.useEffect(() => {
    const parsed = parseChurchVideoUrl(externalUrl);
    if (parsed?.thumbnailUrl && !thumbnailUrl.trim()) {
      setThumbnailUrl(parsed.thumbnailUrl);
    }
  }, [externalUrl, thumbnailUrl]);

  async function handleSave() {
    const parsed = parseChurchVideoUrl(externalUrl);
    if (!parsed) {
      toast.error("Enter a YouTube, Vimeo, or Instagram video URL.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    const token = await getToken(true);
    if (!token) {
      toast.error("Sign in to add a video.");
      return;
    }

    setSaving(true);
    try {
      await createChurchVideo(
        {
          title: title.trim(),
          description: description.trim(),
          externalUrl: parsed.canonicalUrl,
          thumbnailUrl: thumbnailUrl.trim() || parsed.thumbnailUrl,
          category,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          published,
          contentScope,
          churchId: contentScope === "organization" ? churchId : undefined,
        },
        token
      );
      toast.success(published ? "Video published." : "Video saved as a draft.");
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save video.");
    } finally {
      setSaving(false);
    }
  }

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
          "inset-x-auto bottom-0 left-1/2 flex h-auto max-h-[min(92vh,760px)] w-[min(calc(100%-1.5rem),640px)] -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-t-2xl border border-border p-0 shadow-xl",
          "md:bottom-auto md:top-1/2 md:max-h-[min(88vh,720px)] md:-translate-y-1/2 md:rounded-2xl",
          "[&>button.absolute]:hidden"
        )}
      >
        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle>Add Video</SheetTitle>
            <SheetDescription>
              Link official church video from YouTube, Vimeo, or Instagram. Files
              are not uploaded.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className={fieldInputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sunday worship"
              className={fieldInputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-thumb">Thumbnail URL (optional)</Label>
            <Input
              id="video-thumb"
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
              className={fieldInputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as ShortCategory)}
              >
                <SelectTrigger className={fieldInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHORT_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-tags">Tags</Label>
              <Input
                id="video-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="worship, sunday"
                className={fieldInputClass}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Publish</p>
              <p className="text-xs text-muted-foreground">
                Visible to the church when enabled.
              </p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ?
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            : <>
                <Plus className="size-4" aria-hidden />
                Add Video
              </>
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
