import Link from "next/link";

import { cn } from "@/lib/utils";

export function ParishButton({
  href,
  children,
  variant = "forest",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "forest" | "gold" | "ghost" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "parish-btn",
        variant === "gold" && "parish-btn-gold",
        variant === "ghost" && "parish-btn-ghost",
        variant === "light" && "parish-btn-light",
        className
      )}
    >
      {children}
    </Link>
  );
}
