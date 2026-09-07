"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { cn } from "@/lib/utils";

type AdminQuickEditButtonProps = {
  /** Navigates to a workspace edit route. */
  href?: string;
  /** Opens an in-place editor instead of navigating. */
  onSelect?: () => void;
  label?: string;
  className?: string;
};

export function AdminQuickEditButton({
  href,
  onSelect,
  label = "Edit",
  className,
}: AdminQuickEditButtonProps) {
  const isAdmin = useIsAdmin();

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
      {label}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
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
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
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
