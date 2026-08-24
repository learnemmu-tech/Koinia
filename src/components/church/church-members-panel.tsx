"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const { organization } = useOrganization();
  const [data, setData] = useState<BranchMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      if (res.ok) {
        setData((await res.json()) as BranchMembersResponse);
        setSelectedIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [organization, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = data?.pending ?? [];
  const active = data?.active ?? [];
  const usersById = data?.usersById ?? {};

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
        throw new Error(body.error ?? "Failed to update members");
      }
      toast.success(
        action === "approve" ?
          membershipIds.length > 1 ?
            `${membershipIds.length} members approved`
          : "Member approved"
        : membershipIds.length > 1 ?
          `${membershipIds.length} requests rejected`
        : "Request rejected"
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update members"
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
              aria-label={`Select ${name}`}
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
              Requested {formatRequestedDate(member.createdAt)}
            </p>
          </div>
        </div>
        {options?.showActions ?
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void review([member.id], "approve")}
            >
              <UserCheck className="mr-1.5 size-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void review([member.id], "reject")}
            >
              <UserX className="mr-1.5 size-4" />
              Reject
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
          <CardTitle className="text-base">Pending requests</CardTitle>
          <CardDescription>
            {churchName ?
              `People who requested to join ${churchName} via your join link.`
            : "Approve requests to grant access to church content."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending.length > 0 ?
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={toggleSelectAllPending}
                >
                  {allPendingSelected ? "Clear selection" : "Select all"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || selectedIds.size === 0}
                  onClick={() =>
                    void review(Array.from(selectedIds), "approve")
                  }
                >
                  Bulk approve
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
                  Bulk reject
                </Button>
              </div>
              <ul className="space-y-3">
                {pending.map((member) =>
                  renderMemberRow(member, {
                    showActions: true,
                    selectable: true,
                  })
                )}
              </ul>
            </>
          : <p className="text-sm text-muted-foreground">
              No pending requests right now.
            </p>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approved members</CardTitle>
          <CardDescription>
            Active members with access to this church workspace.
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
                    <div className="min-w-0">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user?.email ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          : <p className="text-sm text-muted-foreground">
              No approved members yet. Share your join link to get started.
            </p>
          }
        </CardContent>
      </Card>
    </div>
  );
}
