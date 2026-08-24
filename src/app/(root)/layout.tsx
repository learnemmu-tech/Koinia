import React from "react";
import { cookies } from "next/headers";

import { WelcomeMemberBanner } from "@/components/auth/welcome-member-banner";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { AppSiteHeader } from "@/components/app-sidebar/app-site-header";
import { pageShellClass } from "@/lib/responsive-classes";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({ children }: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppSiteHeader />
        <div className={pageShellClass}>
          <WelcomeMemberBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
