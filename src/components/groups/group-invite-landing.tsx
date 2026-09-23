"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { joinPathForSlug } from "@/lib/auth/auth-paths";
import {
  fetchGroupInvitePreview,
  joinGroupByToken,
  type GroupInvitePreview,
} from "@/lib/groups-client";
import { pageNarrowClass, typePageTitleClass } from "@/lib/responsive-classes";

export function GroupInviteLanding({ token }: { token: string }) {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const [preview, setPreview] = useState<GroupInvitePreview | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      const authToken = user ? await user.getIdToken() : undefined;
      setPreview(await fetchGroupInvitePreview(token, authToken));
      setLoadError(false);
    } catch {
      setLoadError(true);
      setPreview(null);
    }
  }, [token, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function join() {
    if (!user) {
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/g/${token}`)}`);
      return;
    }
    setJoining(true);
    try {
      const authToken = await user.getIdToken(true);
      const result = await joinGroupByToken(token, authToken);
      toast.success(
        result.alreadyMember
          ? "You're already a member of this group."
          : `You're now a member of ${preview?.name ?? "this group"}.`
      );
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join.");
    } finally {
      setJoining(false);
    }
  }

  if (loading && !preview && !loadError) {
    return (
      <div className={`${pageNarrowClass} py-16 text-center text-sm text-muted-foreground`}>
        Loading invitation…
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className={`${pageNarrowClass} space-y-3 py-16 text-center`}>
        <h1 className={typePageTitleClass}>Invitation unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This group invite link is invalid or has been replaced.
        </p>
      </div>
    );
  }

  return (
    <section className={`${pageNarrowClass} space-y-6 py-12`}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Users className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{preview.churchName}</p>
        <h1 className={typePageTitleClass}>{preview.name}</h1>
        <p className="text-sm text-muted-foreground">
          {preview.description || "Join this church group."}
        </p>
      </div>
      {preview.canJoin ?
        <Button onClick={() => void join()} disabled={joining}>
          {joining ?
            <>
              <Loader2 className="size-4 animate-spin" />
              Joining…
            </>
          : "Join Group"}
        </Button>
      : <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You must be an approved member of {preview.churchName} before you can
            join this group. This link does not grant church membership.
          </p>
          <Button asChild>
            <Link href={joinPathForSlug(preview.churchJoinSlug)}>Join Church</Link>
          </Button>
          {!user ?
            <Button asChild variant="outline">
              <Link href={`/signin?callbackUrl=${encodeURIComponent(`/g/${token}`)}`}>
                Sign in
              </Link>
            </Button>
          : null}
        </div>
      }
    </section>
  );
}
