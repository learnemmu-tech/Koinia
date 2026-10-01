import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared content width so every section lines up with the header and footer. */
export function HeritageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function HeritageSectionHeading({
  eyebrow,
  title,
  className,
  titleClassName,
  as: Tag = "h2",
}: {
  eyebrow: string;
  title: ReactNode;
  className?: string;
  titleClassName?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={className}>
      <p className="heritage-eyebrow">{eyebrow}</p>
      <Tag
        className={cn(
          "heritage-display mt-3 text-[length:var(--heritage-section)]",
          titleClassName
        )}
      >
        {title}
      </Tag>
    </div>
  );
}
