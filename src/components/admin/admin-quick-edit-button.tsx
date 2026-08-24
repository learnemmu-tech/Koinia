"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { cn } from "@/lib/utils";

type AdminQuickEditButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export function AdminQuickEditButton({
  href,
  label = "Edit",
  className,
}: AdminQuickEditButtonProps) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) return null;

  return (
    <Link
      href={href}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border/60",
        "bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm",
        "backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground",
        className
      )}
    >
      <Pencil className="size-3" />
      {label}
    </Link>
  );
}
