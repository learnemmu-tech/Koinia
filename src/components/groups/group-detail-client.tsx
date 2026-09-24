"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupDetail } from "@/types/church-group";
import type { GroupChatMessage } from "@/types/group-chat";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { GroupChatPanel } from "@/components/groups/group-chat-panel";
import { GroupEditDialog } from "@/components/groups/group-edit-dialog";
import { GroupInfoSheet } from "@/components/groups/group-info-sheet";
import { GroupMembersSheet } from "@/components/groups/group-members-sheet";
import { InviteMembersDialog } from "@/components/groups/invite-members-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useAllowTrialWrite } from "@/context/subscription-context";
import {
  archiveChurchGroup,
  leaveChurchGroup,
  respondToGroupInvitation,
} from "@/lib/groups-client";

type GroupDetailClientProps = {
  initialGroup: ChurchGroupDetail;
  initialMessages: GroupChatMessage[];
  initialHasMore: boolean;
  currentUserId: string;
};

export function GroupDetailClient({
  initialGroup,
  initialMessages,
  initialHasMore,
  currentUserId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const allowWrite = useAllowTrialWrite();
  const [group, setGroup] = useState(initialGroup);
  const [membersOpen, setMembersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken(true);
  }, [user]);

  const groupsHref = "/community?tab=groups";
  const canChat = group.isMember;
  const actorIsOwner = group.myRole === "owner";
  const canEdit = group.canManageMembers && (actorIsOwner || group.myRole === "admin");
  const canArchive = group.canManage;
  const createdLabel = new Date(group.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function leave() {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await leaveChurchGroup(group.id, token);
      toast.success("You left the group.");
      router.push(groupsHref);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not leave.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await archiveChurchGroup(group.id, token);
      toast.success("Group archived.");
      router.push(groupsHref);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive.");
    } finally {
      setBusy(false);
      setArchiveOpen(false);
    }
  }

  async function handleInvitation(action: "accept" | "decline") {
    if (!group.pendingInvitationId) return;
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      const result = await respondToGroupInvitation(
        group.pendingInvitationId,
        action,
        token
      );
      if (result.joined) {
        toast.success(`You're now a member of ${group.name}.`);
        router.refresh();
      } else {
        toast.success("Invitation declined.");
        router.push(groupsHref);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not respond.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-page-fullbleed
      className="flex min-h-full flex-col bg-background pb-8"
    >
      <div className="mx-auto w-full max-w-[87.5rem] px-4 pt-4 sm:px-6 sm:pt-5">
        <Link
          href={groupsHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Groups
        </Link>

        <header className="border-b border-border pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <GroupAvatar
                imageUrl={group.imageUrl}
                name={group.name}
                className="size-14 shrink-0 rounded-xl sm:size-[4.5rem]"
              />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-xl font-semibold text-foreground sm:text-[1.35rem]">
                  {group.name}
                </h1>
                {group.description ?
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {group.isMember || group.canManageMembers ?
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg"
                  onClick={() => setMembersOpen(true)}
                >
                  Members
                </Button>
              : null}
              {group.canManageMembers ?
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-lg"
                  onClick={() => {
                    if (!allowWrite({ action: "manage", resource: "group" })) return;
                    setInviteOpen(true);
                  }}
                >
                  Invite Members
                </Button>
              : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg"
                    aria-label="Group actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {actorIsOwner || canEdit ?
                    <DropdownMenuItem
                      onSelect={() => {
                        if (!allowWrite({ action: "edit", resource: "group" })) return;
                        setEditOpen(true);
                      }}
                    >
                      Edit group
                    </DropdownMenuItem>
                  : null}
                  {group.canManageMembers ?
                    <>
                      <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                        Manage members
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          if (!allowWrite({ action: "manage", resource: "group" })) return;
                          setInviteOpen(true);
                        }}
                      >
                        Invite members
                      </DropdownMenuItem>
                    </>
                  : null}
                  <DropdownMenuItem onSelect={() => setInfoOpen(true)}>
                    Group info
                  </DropdownMenuItem>
                  {actorIsOwner ?
                    <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                      Transfer ownership
                    </DropdownMenuItem>
                  : null}
                  {canArchive ?
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          if (!allowWrite({ action: "delete", resource: "group" })) return;
                          setArchiveOpen(true);
                        }}
                      >
                        Archive group
                      </DropdownMenuItem>
                    </>
                  : null}
                  {group.isMember && group.myRole !== "owner" ?
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => void leave()}>
                        Leave group
                      </DropdownMenuItem>
                    </>
                  : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {group.pendingInvitationId ?
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                className="h-9 rounded-lg"
                disabled={busy}
                onClick={() => void handleInvitation("accept")}
              >
                Join group
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={busy}
                onClick={() => void handleInvitation("decline")}
              >
                Decline
              </Button>
            </div>
          : null}
        </header>

        <section
          aria-labelledby="group-chat-heading"
          className="mt-4 flex min-h-[min(68vh,720px)] flex-col overflow-hidden border-y border-border"
        >
          <div className="shrink-0 border-b border-border px-4 py-2 sm:px-5">
            <h2
              id="group-chat-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Group chat
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {canChat ?
              <GroupChatPanel
                groupId={group.id}
                groupName={group.name}
                canChat
                currentUserId={currentUserId}
                initialMessages={initialMessages}
                initialHasMore={initialHasMore}
                welcomeImageUrl={group.imageUrl}
                fullWidth
              />
            : group.pendingInvitationId ?
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <GroupAvatar
                  imageUrl={group.imageUrl}
                  name={group.name}
                  className="size-14 rounded-xl"
                />
                <p className="mt-3 font-heading text-base font-semibold">
                  You&apos;re invited to {group.name}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Accept the invitation to join the conversation.
                </p>
              </div>
            : <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <p className="font-heading text-base font-semibold">Members only</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Group chat is available to members of {group.name}.
                </p>
              </div>
            }
          </div>
        </section>

        <section
          aria-labelledby="group-info-heading"
          className="mt-5 border-t border-border pt-5"
        >
          <h2
            id="group-info-heading"
            className="text-sm font-semibold text-foreground"
          >
            Group information
          </h2>
          <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">About</dt>
              <dd className="mt-0.5 text-foreground">
                {group.description || "No description yet."}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Created by
              </dt>
              <dd className="mt-0.5 text-foreground">
                {group.createdByName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-foreground">{createdLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Members</dt>
              <dd className="mt-0.5 text-foreground">
                {group.memberCount}{" "}
                {group.memberCount === 1 ? "member" : "members"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <GroupMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        group={group}
        getToken={getToken}
        onGroupChange={setGroup}
      />
      <GroupInfoSheet open={infoOpen} onOpenChange={setInfoOpen} group={group} />
      {group.canManageMembers ?
        <InviteMembersDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          groupId={group.id}
          groupName={group.name}
          memberCount={group.memberCount}
          pendingInvitationCount={group.pendingInvitationCount}
          inviteToken={group.inviteToken}
          getToken={getToken}
          onTokenChanged={(token) =>
            setGroup((prev) => ({ ...prev, inviteToken: token }))
          }
          onInvited={() =>
            setGroup((prev) => ({
              ...prev,
              pendingInvitationCount: prev.pendingInvitationCount + 1,
            }))
          }
        />
      : null}
      {(canEdit || actorIsOwner) ?
        <GroupEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          group={group}
          getToken={getToken}
          onUpdated={(patch) => setGroup((prev) => ({ ...prev, ...patch }))}
        />
      : null}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive &ldquo;{group.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Members will no longer be able to use this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void archive();
              }}
            >
              Archive group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
