"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PublicFooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/shorts" || pathname.startsWith("/shorts/")) {
    return null;
  }
  return children;
}
