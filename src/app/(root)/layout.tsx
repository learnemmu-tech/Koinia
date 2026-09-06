import React from "react";

import { WelcomeMemberBanner } from "@/components/auth/welcome-member-banner";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { AppSiteHeader } from "@/components/app-sidebar/app-site-header";
import { pageShellClass } from "@/lib/responsive-classes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
        <AppSiteHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden has-[[data-page-fullbleed]]:overflow-hidden">
          <div
            className={cn(
              pageShellClass,
              // Shorts fills the pane below the site header and owns feed scrolling.
              "has-[[data-page-fullbleed]]:max-w-none has-[[data-page-fullbleed]]:gap-0 has-[[data-page-fullbleed]]:p-0 has-[[data-page-fullbleed]]:h-full has-[[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:overflow-hidden has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:min-h-0 has-[[data-page-fullbleed]]:[&>[data-page-fullbleed]]:flex-1"
            )}
          >
            <WelcomeMemberBanner />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
