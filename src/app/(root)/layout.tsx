import React from "react";

import { WelcomeMemberBanner } from "@/components/auth/welcome-member-banner";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { AppSiteHeader } from "@/components/app-sidebar/app-site-header";
import { pageShellClass } from "@/lib/responsive-classes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
        <AppSiteHeader />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={pageShellClass}>
            <WelcomeMemberBanner />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
