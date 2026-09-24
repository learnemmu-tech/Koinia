"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useAllowTrialWrite } from "@/context/subscription-context";

export function BooksAdminBar({ canManage }: { canManage: boolean }) {
  const t = useTranslations("books");
  const router = useRouter();
  const allowWrite = useAllowTrialWrite();

  if (!canManage) return null;

  return (
    <Button
      type="button"
      size="sm"
      className="h-9 rounded-lg px-3.5"
      onClick={() => {
        if (!allowWrite({ action: "create", resource: "book" })) return;
        router.push("/dashboard/books/new");
      }}
    >
      <Plus className="size-4" aria-hidden />
      {t("addBook")}
    </Button>
  );
}
