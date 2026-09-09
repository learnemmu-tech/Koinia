"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export function BooksBackLink({
  href = "/books",
  label,
}: {
  href?: string;
  label?: string;
}) {
  const t = useTranslations("books");
  const resolvedLabel = label ?? t("backToBooks");
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      {resolvedLabel}
    </Link>
  );
}

export function BookPageHeader({
  title,
  description,
  action,
  headingId,
  backHref,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  headingId?: string;
  backHref?: string;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-3">
      {backHref ? <BooksBackLink href={backHref} /> : null}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1
            id={headingId}
            className="font-heading text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-[1.75rem]"
          >
            {title}
          </h1>
          {description ?
            <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
          : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
