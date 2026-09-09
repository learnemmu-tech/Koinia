"use client";

import { typePageTitleClass } from "@/lib/responsive-classes";
import { useTranslations } from "next-intl";

type HeadingNamespace = "songs" | "sermons" | "articles" | "events" | "donations";

export function I18nPageHeading({
  ns,
  headingId,
}: {
  ns: HeadingNamespace;
  headingId: string;
}) {
  const t = useTranslations(ns);

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
        {t("eyebrow")}
      </p>
      <h1 id={headingId} className={typePageTitleClass}>
        {t("title")}
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        {t("description")}
      </p>
    </div>
  );
}
