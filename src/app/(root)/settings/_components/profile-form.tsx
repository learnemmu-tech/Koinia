"use client";

import React from "react";
import Image from "next/image";
import { Pen } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { currentlyInDev } from "@/lib/utils";

export function ProfileForm() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { authUser, profile, signOut } = useFirebaseAuth();

  const displayName =
    profile ?
      `${profile.firstName} ${profile.lastName}`.trim()
    : authUser?.displayName ?? "";

  async function handleSignOut() {
    try {
      await signOut();
      toast.success(tAuth("signedOut"));
    } catch {
      toast.error(tAuth("signOutFailed"));
    }
  }

  return (
    <div className="flex w-full max-w-5xl justify-between gap-4 px-6 py-2">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">{t("nameLabel")}</Label>
            <Input
              id="profile-name"
              value={displayName}
              readOnly
              className="w-96 shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">{tAuth("email")}</Label>
            <Input
              id="profile-email"
              type="email"
              value={authUser?.email ?? ""}
              readOnly
              className="w-96 shadow-sm"
            />
          </div>

          <Button type="button" onClick={currentlyInDev} className="shadow-sm">
            {tCommon("saveChanges")}
          </Button>
        </div>

        <div id="delete-account" className="space-y-4">
          <p className="text-3xl font-bold text-destructive drop-shadow">
            {t("dangerZone")}
          </p>
          <Separator />

          <div className="flex justify-between gap-4">
            <div>
              <p className="font-medium">{t("signOutTitle")}</p>
              <small className="text-muted-foreground">
                {t("signOutDescription")}
              </small>
            </div>

            <Button variant="destructive" onClick={handleSignOut}>
              {tAuth("signOut")}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative size-52 overflow-hidden">
        <Image
          src={authUser?.photoURL ?? "/images/placeholder/user.jpg"}
          alt={displayName || t("profilePhotoAlt")}
          fill
          className="rounded-full border p-1 shadow-sm"
        />

        <Button
          size="sm"
          variant="outline"
          onClick={currentlyInDev}
          className="absolute bottom-4 left-0 gap-2 shadow-sm"
        >
          <Pen size={14} /> {tCommon("edit")}
        </Button>
      </div>
    </div>
  );
}
