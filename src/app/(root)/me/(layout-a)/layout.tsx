"use client";

import Link from "next/link";
import { Edit, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/require-auth";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { Navbar } from "./_components/navbar";

function MeLayoutContent({ children }: React.PropsWithChildren) {
  const { authUser, profile, signOut } = useFirebaseAuth();

  const displayName =
    profile ?
      `${profile.firstName} ${profile.lastName}`.trim()
    : authUser?.displayName ?? "User";

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Failed to sign out.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full border transition-[width] duration-1000 md:w-56 xl:w-64">
          <ImageWithFallback
            src={authUser?.photoURL ?? ""}
            fallback="/images/placeholder/user.jpg"
            alt={displayName}
            fill
            className="rounded-full p-1"
          />

          <Skeleton className="absolute inset-1 -z-10 rounded-full" />
        </div>

        <div className="flex flex-col items-center justify-center gap-y-2 font-medium lg:items-start lg:gap-6">
          <div className="text-center lg:text-start">
            <h1 className="max-w-5xl truncate font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
              {displayName}
            </h1>

            <small className="text-muted-foreground">
              <Mail className="mr-1 inline-block size-4" />
              {authUser?.email ?? "you@example.com"}
            </small>
          </div>

          <div className="space-x-4">
            <Link
              href="/settings#account"
              className={buttonVariants({
                size: "sm",
                variant: "secondary",
                className: "w-24",
              })}
            >
              <Edit className="mr-2 size-4" /> Edit
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className={buttonVariants({
                size: "sm",
                variant: "destructive",
                className: "w-24",
              })}
            >
              <LogOut className="mr-2 size-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <Navbar />

      <main className="mb-4 min-h-[30rem]">{children}</main>
    </section>
  );
}

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <RequireAuth>
      <MeLayoutContent>{children}</MeLayoutContent>
    </RequireAuth>
  );
}
