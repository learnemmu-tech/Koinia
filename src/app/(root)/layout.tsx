import React from "react";

import { WelcomeMemberBanner } from "@/components/auth/welcome-member-banner";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { MobileSidebarTrigger } from "@/components/app-sidebar/mobile-sidebar-trigger";
import { pageShellClass } from "@/lib/responsive-classes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 bg-background">
        <MobileSidebarTrigger />
        <div className={pageShellClass}>
          <WelcomeMemberBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
