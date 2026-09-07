"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  updatePlatformShortDetails,
  type PlatformShortDetails,
} from "@/lib/super-admin/platform-content-actions";
import type { ShortVisibility } from "@/types/video-short";

export function PlatformShortEditDialog({
  short,
  onClose,
  onSaved,
}: {
  short: PlatformShortDetails;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(short.title);
  const [description, setDescription] = useState(short.description);
  const [topic, setTopic] = useState(short.topic);
  const [visibility, setVisibility] = useState<ShortVisibility>(
    short.visibility
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    const result = await updatePlatformShortDetails({
      id: short.id,
      title,
      description,
      topic,
      visibility,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Short updated.");
    onSaved();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit platform Short</DialogTitle>
          <DialogDescription>
            Update the details shown on the public Shorts feed. The video itself
            cannot be replaced here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="platform-short-title">Title</Label>
            <Input
              id="platform-short-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short title"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="platform-short-description">Description</Label>
            <Textarea
              id="platform-short-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this Short about?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="platform-short-topic">Topic</Label>
            <Input
              id="platform-short-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Worship, Testimony, Encouragement…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="platform-short-visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as ShortVisibility)}
            >
              <SelectTrigger id="platform-short-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="church">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
