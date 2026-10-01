"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function isHomeOverlayPath(pathname: string, homeHref: string) {
  return (
    pathname === homeHref ||
    pathname === `${homeHref}/` ||
    pathname.startsWith("/preview/website/")
  );
}

/** Cream sticky bar on inner pages; transparent overlay on the homepage hero. */
export function HeritageHeaderFrame({
  homeHref,
  children,
}: {
  homeHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const overlay = isHomeOverlayPath(pathname, homeHref);

  return (
    <header
      data-heritage-header
      data-solid={overlay ? "false" : "true"}
      data-overlay={overlay ? "true" : "false"}
      className={cn(
        "isolate z-[80] w-full max-w-full overflow-visible",
        overlay
          ? "heritage-header-overlay absolute top-0 border-0 bg-transparent text-[var(--heritage-primary-foreground)]"
          : "sticky top-0 border-b border-[var(--heritage-border)] bg-[var(--heritage-background)] text-[var(--heritage-text)] shadow-[0_1px_0_rgba(32,38,36,0.06)]"
      )}
    >
      {children}
    </header>
  );
}
