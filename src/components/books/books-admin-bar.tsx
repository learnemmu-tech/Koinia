"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function BooksAdminBar({ canManage }: { canManage: boolean }) {
  const t = useTranslations("books");

  if (!canManage) return null;

  return (
    <Button asChild size="sm" className="h-9 rounded-lg px-3.5">
      <Link href="/dashboard/books/new">
        <Plus className="size-4" aria-hidden />
        {t("addBook")}
      </Link>
    </Button>
  );
}
