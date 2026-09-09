"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { BookPageHeader } from "@/components/books/book-page-header";

export function BooksListHeader({
  headingId,
  action,
  backHref,
  titleKey = "title",
  descriptionKey = "description",
}: {
  headingId?: string;
  action?: ReactNode;
  backHref?: string;
  titleKey?: "title" | "createTitle" | "editTitle";
  descriptionKey?: "description" | "formDescription";
}) {
  const t = useTranslations("books");

  return (
    <BookPageHeader
      headingId={headingId}
      title={t(titleKey)}
      description={t(descriptionKey)}
      action={action}
      backHref={backHref}
    />
  );
}
