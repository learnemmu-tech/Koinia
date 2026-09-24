"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { useAllowTrialWrite } from "@/context/subscription-context";
import { cn } from "@/lib/utils";
import type { TrialWriteRequest } from "@/lib/subscription/trial-write";

type AdminQuickEditButtonProps = {
  /** Navigates to a workspace edit route. */
  href?: string;
  /** Opens an in-place editor instead of navigating. */
  onSelect?: () => void;
  label?: string;
  className?: string;
  trialWrite?: TrialWriteRequest;
};

export function AdminQuickEditButton({
  href,
  onSelect,
  label,
  className,
  trialWrite,
}: AdminQuickEditButtonProps) {
  const tCommon = useTranslations("common");
  const isAdmin = useIsAdmin();
  const allowWrite = useAllowTrialWrite();
  const resolvedLabel = label ?? tCommon("edit");

  if (!isAdmin) return null;

  const buttonClassName = cn(
    "inline-flex items-center gap-1 rounded-md border border-border/60",
    "bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm",
    "backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground",
    className
  );

  const content = (
    <>
      <Pencil className="size-3" />
      {resolvedLabel}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={resolvedLabel}
        onClick={(event) => {
          event.stopPropagation();
          if (trialWrite && !allowWrite(trialWrite)) {
            event.preventDefault();
          }
        }}
        className={buttonClassName}
      >
        {content}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        aria-label={resolvedLabel}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (trialWrite && !allowWrite(trialWrite)) return;
          onSelect();
        }}
        className={buttonClassName}
      >
        {content}
      </button>
    );
  }

  return null;
}
