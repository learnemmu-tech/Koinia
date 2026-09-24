"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupSummary } from "@/types/church-group";
import {
  GroupImagePicker,
  GroupImageUploadStatus,
  persistGroupImage,
} from "@/components/groups/group-image-picker";
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
import { createChurchGroup, updateChurchGroup } from "@/lib/groups-client";
import { responsiveDialogContentClass } from "@/lib/responsive-classes";
import { useTrialWriteMountGuard } from "@/components/subscription/trial-write-guard";

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  churchName?: string;
  getToken: () => Promise<string | null>;
  onCreated: (group: ChurchGroupSummary) => void;
};

export function CreateGroupDialog({
  open,
  onOpenChange,
  churchId,
  churchName,
  getToken,
  onCreated,
}: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  useTrialWriteMountGuard(
    { action: "create", resource: "group" },
    open,
    () => onOpenChange(false)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setNameError("");
    setPreviewUrl(null);
    setImageFile(null);
    setUploadError(null);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Enter a group name.");
      return;
    }
    const token = await getToken();
    if (!token) {
      toast.error("Sign in to create a group.");
      return;
    }
    setSaving(true);
    setUploadError(null);
    try {
      let group = await createChurchGroup(
        { churchId, name: trimmed, description: description.trim() },
        token
      );
      if (imageFile) {
        setUploading(true);
        try {
          const imageUrl = await persistGroupImage({
            groupId: group.id,
            file: imageFile,
            token,
          });
          group = await updateChurchGroup(group.id, { imageUrl }, token);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Image upload failed.";
          setUploadError(message);
          toast.error("Group created, but the image could not be uploaded.");
        } finally {
          setUploading(false);
        }
      }
      toast.success("Group created.");
      reset();
      onOpenChange(false);
      onCreated(group);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create group.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className={responsiveDialogContentClass}>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a dedicated space for members to connect around a shared
            ministry, study, or community
            {churchName ? ` at ${churchName}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <GroupImagePicker
            previewUrl={previewUrl}
            onPreviewUrlChange={setPreviewUrl}
            onFileChange={setImageFile}
            disabled={saving}
          />
          <GroupImageUploadStatus uploading={uploading} error={uploadError} />
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="Bible Study"
              className="h-11 rounded-xl"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "group-name-error" : undefined}
              maxLength={80}
            />
            {nameError ?
              <p id="group-name-error" className="text-sm text-destructive">
                {nameError}
              </p>
            : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Weekly Bible study and discussion"
              rows={3}
              className="min-h-[5.5rem] rounded-xl"
              maxLength={400}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl"
            onClick={() => void handleCreate()}
            disabled={saving}
          >
            {saving ?
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
