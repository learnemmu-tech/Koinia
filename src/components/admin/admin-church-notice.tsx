"use client";

import { useTranslations } from "next-intl";

export function AdminChurchNotice() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      {t("churchNotice")}
    </div>
  );
}
