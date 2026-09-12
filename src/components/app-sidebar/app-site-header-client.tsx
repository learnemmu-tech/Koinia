"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchMenuClient } from "@/components/search/search-menu-client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { useMounted } from "@/hooks/use-mounted";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";
import { getGlobalSearchPlaceholder } from "@/lib/worship-collection";

export function AppSiteHeaderClient() {
  const tCommon = useTranslations("common");
  const { authUser, loading } = useFirebaseAuth();
  const mounted = useMounted();
  const pathname = usePathname();
  const scopeState = useContentTenantScope();

  const searchScope = useMemo(
    () => ({
      organizationId: scopeState.organizationId,
      churchId: scopeState.churchId,
      branchId: scopeState.branchId,
    }),
    [scopeState.organizationId, scopeState.churchId, scopeState.branchId]
  );

  if (isMembershipStatusPath(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:gap-3 sm:px-4 dark:border-border/60 dark:bg-background/95 dark:supports-[backdrop-filter]:bg-background/90">
      {/* Left — sidebar toggle */}
      <div className="flex w-9 shrink-0 items-center justify-start sm:w-10">
        <SidebarTrigger className="-ml-0.5 shrink-0" />
      </div>

      {/* Center — global search */}
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="flex w-full max-w-[40rem] justify-center sm:block">
          <SearchMenuClient
            scope={searchScope}
            placeholder={getGlobalSearchPlaceholder()}
            enableShortcut
          />
        </div>
      </div>

      {/* Right — language + notifications */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <LocaleSwitcher />
        {!mounted || loading ?
          <div className="size-9 sm:size-10" aria-hidden />
        : authUser ?
          <NotificationBell userId={authUser.uid} />
        : <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/signin">{tCommon("signIn")}</Link>
          </Button>
        }
      </div>
    </header>
  );
}
