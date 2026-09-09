"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import type { EmailNotificationPreferences } from "@/lib/email/types";
import { DEFAULT_EMAIL_PREFERENCES } from "@/lib/email/preferences";

const PREFERENCE_ITEM_KEYS = [
  { key: "song", titleKey: "songsTitle", descriptionKey: "songsDescription" },
  { key: "sermon", titleKey: "sermonsTitle", descriptionKey: "sermonsDescription" },
  { key: "article", titleKey: "articlesTitle", descriptionKey: "articlesDescription" },
  { key: "event", titleKey: "eventsTitle", descriptionKey: "eventsDescription" },
  { key: "donation", titleKey: "donationsTitle", descriptionKey: "donationsDescription" },
  { key: "prayer", titleKey: "prayerTitle", descriptionKey: "prayerDescription" },
] as const satisfies {
  key: keyof EmailNotificationPreferences;
  titleKey: string;
  descriptionKey: string;
}[];

export function EmailNotificationSettings() {
  const t = useTranslations("settings.emailNotifications");
  const tSettings = useTranslations("settings");
  const { user } = useFirebaseAuth();
  const [preferences, setPreferences] =
    useState<EmailNotificationPreferences>(DEFAULT_EMAIL_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<
    keyof EmailNotificationPreferences | null
  >(null);

  const preferenceItems = useMemo(
    () =>
      PREFERENCE_ITEM_KEYS.map((item) => ({
        key: item.key,
        title: t(item.titleKey),
        description: t(item.descriptionKey),
      })),
    [t]
  );

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/email-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        preferences: EmailNotificationPreferences;
      };
      setPreferences(data.preferences);
    } catch {
      // Keep defaults on failure
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  async function updatePreference(
    key: keyof EmailNotificationPreferences,
    value: boolean
  ) {
    if (!user) return;

    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSavingKey(key);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/email-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        setPreferences(previous);
        toast.error(tSettings("emailPreferencesSaveFailed"));
        return;
      }

      toast.success(tSettings("emailPreferencesUpdated"));
    } catch {
      setPreferences(previous);
      toast.error(tSettings("emailPreferencesSaveFailed"));
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {preferenceItems.map((item, index) => (
        <div key={item.key}>
          <div className="flex items-start justify-between gap-4 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {item.description}
              </p>
            </div>

            <Switch
              checked={preferences[item.key]}
              disabled={savingKey === item.key}
              onCheckedChange={(checked) =>
                void updatePreference(item.key, checked)
              }
              aria-label={tSettings("toggleNotification", { title: item.title })}
            />
          </div>

          {index < preferenceItems.length - 1 ?
            <Separator />
          : null}
        </div>
      ))}
    </div>
  );
}
