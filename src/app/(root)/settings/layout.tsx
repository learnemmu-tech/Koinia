import React from "react";

import { SideNavbar } from "./_components/side-navbar";
import { typePageTitleClass } from "@/lib/responsive-classes";

export default function SettingsLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] min-w-0 flex-col">
      <div className="mb-4 space-y-1">
        <h1 className={typePageTitleClass}>Settings</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Manage your account, appearance, and preference settings.
        </p>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col border-t lg:flex-row">
        <aside className="min-w-0 pt-2 lg:max-w-64 lg:shrink-0 lg:border-r lg:pr-4 lg:pt-4 xl:w-1/5">
          <SideNavbar />
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto py-4 lg:py-0 lg:pl-6">
          {children}
        </div>
      </div>
    </div>
  );
}
