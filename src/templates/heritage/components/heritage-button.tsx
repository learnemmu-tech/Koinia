"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const variants = {
  primary: "heritage-btn heritage-btn-primary",
  oxblood: "heritage-btn heritage-btn-oxblood",
  secondary: "heritage-btn heritage-btn-secondary",
  inverse: "heritage-btn heritage-btn-inverse",
  outline: "heritage-btn heritage-btn-outline",
  ghost: "heritage-btn heritage-btn-ghost",
} as const;

type HeritageButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  arrow?: boolean;
};

export function HeritageButton({
  href,
  children,
  variant = "oxblood",
  className,
  arrow = false,
}: HeritageButtonProps) {
  return (
    <Link href={href} className={cn(variants[variant], className)}>
      <span className="inline-flex items-center gap-2">{children}</span>
      {arrow ? <ArrowRight className="size-4 shrink-0" aria-hidden /> : null}
    </Link>
  );
}
