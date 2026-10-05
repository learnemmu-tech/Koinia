"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { persistActiveChurchCookie } from "@/lib/church-cookies";

export function HeritageActiveChurchSync({ churchId }: { churchId: string }) {
  useEffect(() => {
    persistActiveChurchCookie(churchId);
  }, [churchId]);
  return null;
}

export function HeritageMemberAppRedirect({
  churchId,
  href,
}: {
  churchId: string;
  href: string;
}) {
  const router = useRouter();
  const t = useTranslations("heritage.common");

  useEffect(() => {
    persistActiveChurchCookie(churchId);
    router.replace(href);
  }, [churchId, href, router]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="text-[var(--heritage-muted)]">{t("opening")}</p>
    </section>
  );
}
