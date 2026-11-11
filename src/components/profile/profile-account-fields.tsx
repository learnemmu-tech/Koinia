"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { validateImageFile } from "@/lib/upload-limits";

type ProfileAccountFieldsProps = {
  layout?: "card" | "settings";
};

export function ProfileAccountFields({ layout = "card" }: ProfileAccountFieldsProps) {
  const { user, authUser, profile, refreshProfile } = useFirebaseAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? authUser?.photoURL ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (!profile || seeded.current) return;
    seeded.current = true;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    if (profile.photoUrl) setPhotoUrl(profile.photoUrl);
  }, [profile]);

  const displayPhoto = preview || photoUrl || "/images/placeholder/user.jpg";
  const inputClass = layout === "settings" ? "w-96 shadow-sm" : "w-full";

  function onPick(next: File | undefined) {
    if (!next) return;
    const invalid = validateImageFile(next);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function save() {
    if (!user) return;
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      toast.error("First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      let nextPhoto = photoUrl || undefined;
      if (file) {
        const token = await user.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        nextPhoto = await uploadSongFileLocal(user.uid, "cover", formData, undefined, token, {
          kind: "profile-photo",
          replaceUrl: profile?.photoUrl,
        });
        setPhotoUrl(nextPhoto);
        setFile(null);
        setPreview(null);
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: first,
          lastName: last,
          ...(file || profile?.photoUrl ? { photoUrl: nextPhoto } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string; profile?: { photoUrl?: string } };
      if (!response.ok) {
        throw new Error(payload.error || "Could not save profile.");
      }

      await refreshProfile({
        firstName: first,
        lastName: last,
        photoUrl: payload.profile?.photoUrl ?? nextPhoto,
      });
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={layout === "settings" ? "flex w-full max-w-5xl justify-between gap-4" : "space-y-4"}>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name">First name</Label>
            <Input
              id="profile-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-last-name">Last name</Label>
            <Input
              id="profile-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={authUser?.email ?? ""}
            readOnly
            className={inputClass}
          />
        </div>
        <Button type="button" onClick={save} disabled={saving} className="shadow-sm">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="relative size-24 shrink-0 overflow-hidden sm:size-32">
        <Image
          src={displayPhoto}
          alt={firstName || "Profile photo"}
          fill
          unoptimized
          className="rounded-full border object-cover p-1 shadow-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-1 left-0 gap-2 shadow-sm"
        >
          <Pen size={14} /> Edit
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
