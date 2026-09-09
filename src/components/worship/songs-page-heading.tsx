"use client";

import { typePageTitleClass } from "@/lib/responsive-classes";
import { useTranslations } from "next-intl";

export function SongsPageHeading() {
  const t = useTranslations("songs");

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
        {t("eyebrow")}
      </p>
      <h1 id="songs-heading" className={typePageTitleClass}>
        {t("title")}
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        {t("description")}
      </p>
    </div>
  );
}
