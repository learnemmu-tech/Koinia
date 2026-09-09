"use client";

import { useTranslations } from "next-intl";

type SongsTabHeaderProps = {
  count: number;
};

export function SongsTabHeader({ count }: SongsTabHeaderProps) {
  const t = useTranslations("songs");

  return (
    <header className="mb-4 flex items-end justify-between gap-4 border-b border-border/30 pb-4">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-[1.75rem]">
        {t("title")}
      </h2>
      <p className="shrink-0 rounded-full border border-border/40 bg-muted/40 px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
        {t("songCount", { count })}
      </p>
    </header>
  );
}
