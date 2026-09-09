"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrganization } from "@/context/organization-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import {
  ASSIGNABLE_CHURCH_ROLES,
  formatMembershipRoleLabel,
  isAssignableChurchRole,
  type AssignableChurchRole,
} from "@/types/membership";

type BranchMembersResponse = {
  pending: FirebaseBranchMembership[];
  active: FirebaseBranchMembership[];
  usersById: Record<
    string,
    {
      email: string;
      firstName: string;
      lastName: string;
      photoURL?: string;
    }
  >;
  canManageMembers?: boolean;
};

type ChurchMembersPanelProps = {
  branchId: string;
  churchName?: string;
};

function formatRequestedDate(timestamp: number): string {
  if (!timestamp) return "—";
  return format(new Date(timestamp), "MMM d, yyyy");
}

function memberInitials(
  user?: { firstName: string; lastName: string; email: string }
): string {
  if (!user) return "?";
  const fromName = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
    .trim()
    .toUpperCase();
  if (fromName) return fromName;
  return user.email?.[0]?.toUpperCase() ?? "?";
}

function memberName(
  userId: string,
  usersById: BranchMembersResponse["usersById"]
): string {
  const user = usersById[userId];
  if (!user) return userId;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email || userId;
}

export function ChurchMembersPanel({
  branchId,
  churchName,
}: ChurchMembersPanelProps) {
  const t = useTranslations("churchMembers");
  const tCommon = useTranslations("common");
  const { organization } = useOrganization();
  const [data, setData] = useState<BranchMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleMember, setRoleMember] = useState<FirebaseBranchMembership | null>(
    null
  );
  const [nextRole, setNextRole] = useState<AssignableChurchRole>("member");
  const [removeMember, setRemoveMember] =
    useState<FirebaseBranchMembership | null>(null);

  const load = useCallback(async () => {
    if (!organization) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/memberships/branch?organizationId=${encodeURIComponent(organization.id)}&branchId=${encodeURIComponent(branchId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t("loadFailed"));
        return;
      }
      setData((await res.json()) as BranchMembersResponse);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [organization, branchId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = data?.pending ?? [];
  const active = data?.active ?? [];
  const usersById = data?.usersById ?? {};
  const canManageMembers = Boolean(data?.canManageMembers);

  const allPendingSelected = useMemo(
    () => pending.length > 0 && pending.every((m) => selectedIds.has(m.id)),
    [pending, selectedIds]
  );

  function toggleSelect(membershipId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pending.map((m) => m.id)));
  }

  async function review(
    membershipIds: string[],
    action: "approve" | "reject"
  ) {
    if (!organization || !membershipIds.length) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/memberships/pending", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organization.id,
          membershipIds,
          action,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? t("updateFailed"));
      }
      toast.success(
        action === "approve" ?
          membershipIds.length > 1 ?
            t("membersApproved", { count: membershipIds.length })
          : t("memberApproved")
        : membershipIds.length > 1 ?
          t("requestsRejected", { count: membershipIds.length })
        : t("requestRejected")
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("updateFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveRole() {
    if (!organization || !roleMember) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/memberships/role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organization.id,
          membershipId: roleMember.id,
          role: nextRole,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? t("roleUpdateFailed"));
      }
      toast.success(t("roleUpdated"));
      setRoleMember(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("roleUpdateFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!organization || !removeMember) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/memberships/pending", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organization.id,
          membershipIds: [removeMember.id],
          action: "remove",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? t("memberRemoveFailed"));
      }
      toast.success(t("memberRemoved"));
      setRemoveMember(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("memberRemoveFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  function renderMemberRow(
    member: FirebaseBranchMembership,
    options?: { showActions?: boolean; selectable?: boolean }
  ) {
    const user = usersById[member.userId];
    const name = memberName(member.userId, usersById);

    return (
      <li
        key={member.id}
        className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          {options?.selectable ?
            <input
              type="checkbox"
              className="size-4 shrink-0 rounded border-input"
              checked={selectedIds.has(member.id)}
              onChange={() => toggleSelect(member.id)}
              aria-label={t("selectMember", { name })}
            />
          : null}
          <Avatar className="size-10">
            {user?.photoURL ?
              <AvatarImage src={user.photoURL} alt="" />
            : null}
            <AvatarFallback>{memberInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("requestedDate", { date: formatRequestedDate(member.createdAt) })}
            </p>
          </div>
        </div>
        {options?.showActions && canManageMembers ?
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void review([member.id], "approve")}
            >
              {busy ?
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              : <UserCheck className="mr-1.5 size-4" />}
              {tCommon("approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void review([member.id], "reject")}
            >
              {busy ?
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              : <UserX className="mr-1.5 size-4" />}
              {tCommon("reject")}
            </Button>
          </div>
        : null}
      </li>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pendingRequestsTitle")}</CardTitle>
          <CardDescription>
            {churchName ?
              t("pendingRequestsDescription", { name: churchName })
            : t("pendingRequestsDescriptionGeneric")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending.length > 0 ?
            <>
              {canManageMembers ?
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={toggleSelectAllPending}
                  >
                    {allPendingSelected ? t("clearSelection") : t("selectAll")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || selectedIds.size === 0}
                    onClick={() =>
                      void review(Array.from(selectedIds), "approve")
                    }
                  >
                    {t("bulkApprove")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || selectedIds.size === 0}
                    onClick={() =>
                      void review(Array.from(selectedIds), "reject")
                    }
                  >
                    {t("bulkReject")}
                  </Button>
                </div>
              : null}
              <ul className="space-y-3">
                {pending.map((member) =>
                  renderMemberRow(member, {
                    showActions: canManageMembers,
                    selectable: canManageMembers,
                  })
                )}
              </ul>
            </>
          : <p className="text-sm text-muted-foreground">
              {t("noPendingRequests")}
            </p>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("approvedMembersTitle")}</CardTitle>
          <CardDescription>
            {t("approvedMembersDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active.length > 0 ?
            <ul className="space-y-3">
              {active.map((member) => {
                const user = usersById[member.userId];
                const name = memberName(member.userId, usersById);
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 p-4"
                  >
                    <Avatar className="size-10">
                      {user?.photoURL ?
                        <AvatarImage src={user.photoURL} alt="" />
                      : null}
                      <AvatarFallback>{memberInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user?.email ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatMembershipRoleLabel(member.role)}
                      </p>
                    </div>
                    {canManageMembers ?
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            aria-label={t("actionsForMember", { name })}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() => {
                              setRoleMember(member);
                              setNextRole(
                                isAssignableChurchRole(member.role)
                                  ? member.role
                                  : "member"
                              );
                            }}
                          >
                            {t("editRole")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setRemoveMember(member)}
                          >
                            {t("removeMember")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    : null}
                  </li>
                );
              })}
            </ul>
          : <p className="text-sm text-muted-foreground">
              {t("noApprovedMembers")}
            </p>
          }
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(roleMember)}
        onOpenChange={(open) => {
          if (!open) setRoleMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editRoleTitle")}</DialogTitle>
            <DialogDescription>
              {t("editRoleDescription")}
            </DialogDescription>
          </DialogHeader>
          {roleMember ?
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {memberName(roleMember.userId, usersById)}
                </p>
                <p className="text-muted-foreground">
                  {usersById[roleMember.userId]?.email ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("currentRole", {
                    role: formatMembershipRoleLabel(roleMember.role),
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("roleLabel")}</p>
                <Select
                  value={nextRole}
                  onValueChange={(value) => {
                    if (isAssignableChurchRole(value)) setNextRole(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_CHURCH_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {formatMembershipRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleMember(null)}
              disabled={busy}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="button" onClick={() => void saveRole()} disabled={busy}>
              {busy ?
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              : null}
              {tCommon("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removeMember)}
        onOpenChange={(open) => {
          if (!open) setRemoveMember(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMemberTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeMemberDescription", {
                name:
                  removeMember
                    ? memberName(removeMember.userId, usersById)
                    : t("thisPerson"),
                church: churchName ?? t("thisChurch"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmRemove();
              }}
            >
              {t("removeMember")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
