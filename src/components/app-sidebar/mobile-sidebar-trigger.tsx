"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";

export function MobileSidebarTrigger() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  if (!isMobile || isMembershipStatusPath(pathname)) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
      <SidebarTrigger className="-ml-1 size-8" />
    </div>
  );
}
