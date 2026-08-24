"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import type { EmailNotificationPreferences } from "@/lib/email/types";
import { DEFAULT_EMAIL_PREFERENCES } from "@/lib/email/preferences";

const PREFERENCE_ITEMS: {
  key: keyof EmailNotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    key: "song",
    title: "Songs",
    description: "Email when a new worship song is published.",
  },
  {
    key: "sermon",
    title: "Sermons",
    description: "Email when a new sermon is published.",
  },
  {
    key: "article",
    title: "Articles",
    description: "Email when a new article is published.",
  },
  {
    key: "event",
    title: "Events",
    description:
      "Email when a new event is published and confirmations when you register.",
  },
  {
    key: "donation",
    title: "Donations",
    description:
      "Email when a new giving campaign launches and thank-you receipts after you donate.",
  },
  {
    key: "prayer",
    title: "Prayer updates",
    description:
      "Confirmations when you submit a prayer request and when it is approved.",
  },
];

export function EmailNotificationSettings() {
  const { user } = useFirebaseAuth();
  const [preferences, setPreferences] =
    useState<EmailNotificationPreferences>(DEFAULT_EMAIL_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<
    keyof EmailNotificationPreferences | null
  >(null);

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
        toast.error("Unable to save email preferences. Please try again.");
        return;
      }

      toast.success("Email preferences updated.");
    } catch {
      setPreferences(previous);
      toast.error("Unable to save email preferences. Please try again.");
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
      {PREFERENCE_ITEMS.map((item, index) => (
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
              aria-label={`Toggle ${item.title}`}
            />
          </div>

          {index < PREFERENCE_ITEMS.length - 1 ?
            <Separator />
          : null}
        </div>
      ))}
    </div>
  );
}
