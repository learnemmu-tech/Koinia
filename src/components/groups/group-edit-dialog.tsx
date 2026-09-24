"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupDetail } from "@/types/church-group";
import {
  GroupImagePicker,
  persistGroupImage,
} from "@/components/groups/group-image-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateChurchGroup } from "@/lib/groups-client";
import { useTrialWriteMountGuard } from "@/components/subscription/trial-write-guard";

type GroupEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ChurchGroupDetail;
  getToken: () => Promise<string | null>;
  onUpdated: (patch: Partial<ChurchGroupDetail>) => void;
};

export function GroupEditDialog({
  open,
  onOpenChange,
  group,
  getToken,
  onUpdated,
}: GroupEditDialogProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [previewUrl, setPreviewUrl] = useState<string | null>(group.imageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  useTrialWriteMountGuard(
    { action: "edit", resource: "group" },
    open,
    () => onOpenChange(false)
  );

  useEffect(() => {
    if (!open) return;
    setName(group.name);
    setDescription(group.description);
    setPreviewUrl(group.imageUrl);
    setImageFile(null);
    setRemoveImage(false);
  }, [open, group]);

  async function save() {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      let imageUrl: string | null | undefined;
      if (removeImage) imageUrl = null;
      else if (imageFile) {
        imageUrl = await persistGroupImage({
          groupId: group.id,
          file: imageFile,
          token,
          replaceUrl: group.imageUrl,
        });
      }
      const updated = await updateChurchGroup(
        group.id,
        { name, description, imageUrl },
        token
      );
      onUpdated(updated);
      toast.success("Group updated.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <GroupImagePicker
            previewUrl={removeImage ? null : previewUrl}
            onPreviewUrlChange={(url) => {
              setPreviewUrl(url);
              setRemoveImage(!url && !imageFile);
            }}
            onFileChange={(file) => {
              setImageFile(file);
              if (file) setRemoveImage(false);
            }}
            disabled={busy}
          />
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Group name</Label>
            <Input
              id="edit-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              className="rounded-xl"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={busy}
          >
            {busy ?
              <Loader2 className="size-4 animate-spin" />
            : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
