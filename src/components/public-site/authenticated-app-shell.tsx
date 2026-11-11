import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { AppSiteHeader } from "@/components/app-sidebar/app-site-header";

const WelcomeMemberBanner = dynamic(() =>
  import("@/components/auth/welcome-member-banner").then(
    (module) => module.WelcomeMemberBanner
  )
);
const ShepherdLauncher = dynamic(() =>
  import("@/components/shepherd/shepherd-launcher").then(
    (module) => module.ShepherdLauncher
  )
);
const TrialLifecycleBanner = dynamic(() =>
  import("@/components/subscription/trial-lifecycle-banner").then(
    (module) => module.TrialLifecycleBanner
  )
);
import { pageShellClass } from "@/lib/responsive-classes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/** Existing authenticated application chrome — sidebar + compact site header. */
export function AuthenticatedAppShell({
  children,
  publicVisitor = false,
}: {
  children: ReactNode;
  publicVisitor?: boolean;
}) {
  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden">
      {publicVisitor ? null : <TrialLifecycleBanner />}
      <SidebarProvider
        defaultOpen={true}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
        <AppSidebar />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <AppSiteHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden has-[[data-page-fullbleed]]:overflow-hidden">
            <div
              className={cn(
                pageShellClass,
                "has-[[data-page-fullbleed]]:max-w-none has-[[data-page-fullbleed]]:gap-0 has-[[data-page-fullbleed]]:p-0 has-[[data-page-fullbleed]]:h-full has-[[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:overflow-hidden has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:flex-1"
              )}
            >
              {publicVisitor ? null : <WelcomeMemberBanner />}
              {children}
            </div>
          </div>
          {publicVisitor ? null : <ShepherdLauncher />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
