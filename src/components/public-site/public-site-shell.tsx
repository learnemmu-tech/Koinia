import type { ReactNode } from "react";

import { pageShellClass } from "@/lib/responsive-classes";
import { cn } from "@/lib/utils";

import { PublicFooter } from "./public-footer";
import { PublicFooterGate } from "./public-footer-gate";
import { PublicHeader } from "./public-header";

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-background has-[[data-page-fullbleed]]:h-svh has-[[data-page-fullbleed]]:max-h-svh has-[[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:overflow-hidden">
      <PublicHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden has-[[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:overflow-hidden">
        <div
          className={cn(
            pageShellClass,
            "has-[[data-page-fullbleed]]:h-full has-[[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:max-w-none has-[[data-page-fullbleed]]:gap-0 has-[[data-page-fullbleed]]:overflow-hidden has-[[data-page-fullbleed]]:p-0 has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:flex-1"
          )}
        >
          {children}
        </div>
        <PublicFooterGate>
          <PublicFooter />
        </PublicFooterGate>
      </div>
    </div>
  );
}
