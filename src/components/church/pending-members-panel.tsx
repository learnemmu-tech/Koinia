"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
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

type PendingMembersPanelProps = {
  branchId: string;
};

type PendingResponse = {
  pending: FirebaseBranchMembership[];
  usersById: Record<
    string,
    { email: string; firstName: string; lastName: string }
  >;
};

export function PendingMembersPanel({ branchId }: PendingMembersPanelProps) {
  const { organization } = useOrganization();
  const { invalidateMembers } = useInvalidateAdminQueries();
  const [data, setData] = useState<PendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organization) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/memberships/pending?organizationId=${encodeURIComponent(organization.id)}&branchId=${encodeURIComponent(branchId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData((await res.json()) as PendingResponse);
      }
    } finally {
      setLoading(false);
    }
  }, [organization, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(membershipId: string, action: "approve" | "reject") {
    if (!organization) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setBusyId(membershipId);
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
          membershipId,
          action,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update member");
      }
      toast.success(action === "approve" ? "Member approved" : "Member rejected");
      await invalidateMembers();
      await load();
    } catch {
      toast.error("Failed to update member");
    } finally {
      setBusyId(null);
    }
  }

  function displayName(userId: string) {
    const user = data?.usersById[userId];
    if (!user) return userId;
    const name = `${user.firstName} ${user.lastName}`.trim();
    return name || user.email || userId;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending members</CardTitle>
        <CardDescription>
          Members who joined via your church link. Approve them to grant access
          to private church content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ?
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        : !data?.pending.length ?
          <p className="text-sm text-muted-foreground">
            No pending members right now.
          </p>
        : <ul className="space-y-3">
            {data.pending.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{displayName(member.userId)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {data.usersById[member.userId]?.email ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === member.id}
                    onClick={() => void review(member.id, "approve")}
                  >
                    <UserCheck className="mr-1.5 size-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === member.id}
                    onClick={() => void review(member.id, "reject")}
                  >
                    <UserX className="mr-1.5 size-4" />
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        }
      </CardContent>
    </Card>
  );
}
