"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupSummary } from "@/types/church-group";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { fetchChurchGroups } from "@/lib/groups-client";
import { cn } from "@/lib/utils";
import { useAllowTrialWrite } from "@/context/subscription-context";

/** Compact directory tiles — ~220–280px; do not stretch with few groups. */
const GROUPS_GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

type GroupsPageClientProps = {
  churchId: string;
  churchName: string;
  canManage: boolean;
  initialGroups: ChurchGroupSummary[];
  loadOnMount?: boolean;
  active?: boolean;
  embedded?: boolean;
};

export function GroupsPageClient({
  churchId,
  churchName,
  canManage,
  initialGroups,
  loadOnMount = false,
  active = true,
  embedded = false,
}: GroupsPageClientProps) {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const allowWrite = useAllowTrialWrite();
  const [groups, setGroups] = useState(initialGroups);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(
    loadOnMount && initialGroups.length === 0 && Boolean(churchId)
  );

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken(true);
  }, [user]);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    if (!loadOnMount || !active || !user || !churchId) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const next = await fetchChurchGroups(churchId, token);
        if (!cancelled) setGroups(next);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load groups."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOnMount, active, user, churchId, getToken]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {embedded ?
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Groups
            </h2>
          : <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Groups
            </h1>
          }
          <p className="text-sm text-muted-foreground">
            Smaller communities within your church.
          </p>
        </div>
        {canManage ?
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            onClick={() => {
              if (!allowWrite({ action: "create", resource: "group" })) return;
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Create Group
          </Button>
        : null}
      </header>

      {loading ?
        <ul className={GROUPS_GRID_CLASS}>
          {Array.from({ length: 8 }).map((_, index) => (
            <li key={index} className="w-full max-w-[280px] justify-self-start">
              <Skeleton className="h-[11.25rem] w-full rounded-xl" />
            </li>
          ))}
        </ul>
      : groups.length === 0 ?
        <div className="app-card max-w-lg rounded-xl border border-dashed px-4 py-8 text-center">
          <p className="font-heading text-base font-semibold">No groups yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a space for Bible study, worship, prayer, youth, or another
            church community.
          </p>
          {canManage ?
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => {
              if (!allowWrite({ action: "create", resource: "group" })) return;
              setCreateOpen(true);
            }}>
              <Plus className="size-4" />
              Create Group
            </Button>
          : null}
        </div>
      : <ul className={GROUPS_GRID_CLASS}>
          {groups.map((group) => (
            <li key={group.id} className="w-full max-w-[280px] justify-self-start">
              <Link
                href={`/groups/${group.id}`}
                className={cn(
                  "app-card app-interactive group block overflow-hidden rounded-xl",
                  "hover-hover:hover:border-border-strong"
                )}
              >
                <div className="relative h-[7.5rem] w-full overflow-hidden bg-muted/50 sm:h-32">
                  {group.imageUrl ?
                    <Avatar className="size-full rounded-none">
                      <AvatarImage
                        src={group.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </Avatar>
                  : <div className="flex size-full items-center justify-center">
                      <GroupAvatar
                        imageUrl={null}
                        name={group.name}
                        className="size-10 rounded-lg"
                      />
                    </div>
                  }
                  <span
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  >
                    <ArrowRight className="size-3" />
                  </span>
                </div>
                <div className="space-y-1 p-2.5">
                  <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground">
                    {group.name}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {group.description || "No description yet."}
                  </p>
                  <p className="flex items-center gap-1 pt-0.5 text-xs text-muted-foreground">
                    <UsersRound className="size-3 shrink-0" aria-hidden />
                    {group.memberCount}{" "}
                    {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      }

      {canManage ?
        <CreateGroupDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          churchId={churchId}
          churchName={churchName}
          getToken={getToken}
          onCreated={(group) => {
            setGroups((previous) => [
              group,
              ...previous.filter((item) => item.id !== group.id),
            ]);
            router.refresh();
          }}
        />
      : null}
    </section>
  );
}
