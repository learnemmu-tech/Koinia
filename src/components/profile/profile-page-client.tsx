"use client";

import Link from "next/link";
import { Bookmark, LayoutDashboard, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileAccountFields } from "@/components/profile/profile-account-fields";
import { PlanBadgeFromContext } from "@/components/subscription/plan-badge-from-context";
import { useFavorites } from "@/context/favorites-context";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";

export function ProfilePageClient() {
  const { favorites, loading } = useFavorites();

  return (
    <div className={pageContentClass}>
      <div className="space-y-2">
        <h1 className={typePageTitleClass}>Profile</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          View and manage your account.
        </p>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex justify-end">
          <PlanBadgeFromContext />
        </div>
        <ProfileAccountFields />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
          Activity
        </h2>
        <Link
          href="/profile/dashboard"
          className="flex min-h-touch items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/30 sm:py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">My Dashboard</p>
              <p className="text-sm text-muted-foreground">
                Stats, recent activity, events, and more
              </p>
            </div>
          </div>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
          Library
        </h2>
        <Link
          href="/favorites"
          className="flex min-h-touch items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/30 sm:py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Bookmark className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">Library</p>
              <p className="text-sm text-muted-foreground">
                Saved songs, sermons, and articles
              </p>
            </div>
          </div>
          <div className="shrink-0 text-sm font-semibold text-muted-foreground">
            {loading ? "…" : favorites.length}
          </div>
        </Link>
      </section>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="/settings">
          <Settings className="mr-2 size-4" />
          Settings
        </Link>
      </Button>
    </div>
  );
}
