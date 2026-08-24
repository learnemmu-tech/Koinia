"use client";

import { CalendarDays, Mail, UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { formatJoinDate, getDisplayName } from "@/lib/profile-utils";

export function DashboardWelcomeSection() {
  const { authUser, profile, loading } = useFirebaseAuth();
  const displayName = getDisplayName(profile, authUser);

  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
        <div className="space-y-4 p-6 sm:p-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
      <div className="space-y-5 p-6 sm:p-8">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Welcome back
          </p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            {displayName}
          </h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium">
                {authUser?.email ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">
                {formatJoinDate(profile?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserRound className="size-3.5" />
          <span>Your personalized activity overview</span>
        </div>
      </div>
    </section>
  );
}
