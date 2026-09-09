"use client";

import { typePageTitleClass } from "@/lib/responsive-classes";
import { useTranslations } from "next-intl";

export function SettingsTitle() {
  const t = useTranslations("settings");

  return (
    <div className="mb-4 space-y-1">
      <h1 className={typePageTitleClass}>{t("title")}</h1>
      <p className="text-xs text-muted-foreground sm:text-sm">{t("description")}</p>
    </div>
  );
}
