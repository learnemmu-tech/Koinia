"use client";

import { useMemo, useState } from "react";
import { Loader2, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupDetail, ChurchGroupMember } from "@/types/church-group";
import { groupRoleLabel } from "@/components/groups/group-avatar";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  removeChurchGroupMember,
  transferChurchGroupOwnership,
  updateChurchGroupMemberRole,
} from "@/lib/groups-client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type GroupMembersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ChurchGroupDetail;
  getToken: () => Promise<string | null>;
  onGroupChange: (updater: (prev: ChurchGroupDetail) => ChurchGroupDetail) => void;
};

export function GroupMembersSheet({
  open,
  onOpenChange,
  group,
  getToken,
  onGroupChange,
}: GroupMembersSheetProps) {
  const [query, setQuery] = useState("");
  const [roleMember, setRoleMember] = useState<ChurchGroupMember | null>(null);
  const [nextRole, setNextRole] = useState<"admin" | "member">("member");
  const [removeTarget, setRemoveTarget] = useState<ChurchGroupMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<ChurchGroupMember | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const actorIsOwner = group.myRole === "owner";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.members;
    return group.members.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [group.members, query]);

  function memberActions(member: ChurchGroupMember) {
    if (!group.canManageMembers) return null;
    if (member.role === "owner") return null;
    const canChangeAdmin = actorIsOwner || group.canManage;
    if (member.role === "admin" && !canChangeAdmin) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg"
            aria-label={`Actions for ${member.displayName}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setRoleMember(member);
              setNextRole(member.role === "admin" ? "admin" : "member");
            }}
          >
            Change role
          </DropdownMenuItem>
          {actorIsOwner ?
            <DropdownMenuItem onSelect={() => setTransferTarget(member)}>
              Transfer ownership
            </DropdownMenuItem>
          : null}
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setRemoveTarget(member)}
          >
            Remove from group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await removeChurchGroupMember(group.id, removeTarget.userId, token);
      onGroupChange((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.userId !== removeTarget.userId),
        memberCount: Math.max(0, prev.memberCount - 1),
      }));
      toast.success("Member removed.");
      setRemoveTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRole() {
    if (!roleMember) return;
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      const result = await updateChurchGroupMemberRole(
        group.id,
        roleMember.userId,
        nextRole,
        token
      );
      onGroupChange((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.userId === roleMember.userId ? { ...m, role: result.role } : m
        ),
      }));
      toast.success("Role updated.");
      setRoleMember(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmTransfer() {
    if (!transferTarget) return;
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await transferChurchGroupOwnership(
        group.id,
        transferTarget.userId,
        token
      );
      onGroupChange((prev) => ({
        ...prev,
        createdByUserId: transferTarget.userId,
        createdByName: transferTarget.displayName,
        myRole: prev.myRole === "owner" ? "admin" : prev.myRole,
        members: prev.members.map((m) => {
          if (m.userId === transferTarget.userId) return { ...m, role: "owner" };
          if (m.role === "owner") return { ...m, role: "admin" };
          return m;
        }),
      }));
      toast.success("Ownership transferred.");
      setTransferTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not transfer ownership."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Members</SheetTitle>
            <SheetDescription>
              {group.name} · {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </SheetDescription>
          </SheetHeader>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="h-11 rounded-xl pl-9"
              autoComplete="off"
            />
          </div>
          <ul className="mt-4 min-h-0 flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="text-[11px]">
                      {initials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {groupRoleLabel(member.role)}
                  </span>
                  {memberActions(member)}
                </div>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(roleMember)} onOpenChange={() => setRoleMember(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{roleMember?.displayName}</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="group-role-sheet"
                checked={nextRole === "member"}
                onChange={() => setNextRole("member")}
              />
              Member
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="group-role-sheet"
                checked={nextRole === "admin"}
                onChange={() => setNextRole("admin")}
              />
              Admin
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleMember(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void confirmRole()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be a member of {group.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmRemove();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(transferTarget)}
        onOpenChange={() => setTransferTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              {transferTarget?.displayName} will become the owner. You will become an
              admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmTransfer();
              }}
            >
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
