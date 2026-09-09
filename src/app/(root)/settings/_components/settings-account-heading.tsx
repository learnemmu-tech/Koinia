"use client";

import { useTranslations } from "next-intl";

export function SettingsAccountHeading() {
  const t = useTranslations("settings");

  return (
    <div className="space-y-1 border-b p-4">
      <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
        {t("accountSettings")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("accountDescription")}</p>
    </div>
  );
}
