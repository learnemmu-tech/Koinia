"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ProfileAccountFields } from "@/components/profile/profile-account-fields";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

export function ProfileForm() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const { signOut } = useFirebaseAuth();

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
        <ProfileAccountFields layout="settings" />

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

    </div>
  );
}
