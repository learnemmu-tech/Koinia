"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrganization } from "@/context/organization-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership } from "@/types/membership";

type MembersResponse = {
  organizationMemberships: FirebaseMembership[];
  branchMemberships: FirebaseBranchMembership[];
  usersById: Record<
    string,
    { email: string; firstName: string; lastName: string }
  >;
};

export function OrganizationMembersPanel() {
  const { organization, branchesByChurch } = useOrganization();
  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!organization) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/memberships?organizationId=${encodeURIComponent(organization.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData((await res.json()) as MembersResponse);
      }
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" />;
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">Unable to load members.</p>
    );
  }

  function displayName(userId: string) {
    const u = data!.usersById[userId];
    if (!u) return userId;
    const name = `${u.firstName} ${u.lastName}`.trim();
    return name || u.email || userId;
  }

  function churchNameForBranch(branchId: string) {
    const branch = Object.values(branchesByChurch)
      .flat()
      .find((b) => b.id === branchId);
    return branch?.name ?? branchId;
  }

  function roleLabel(role: string) {
    if (role === "branch_admin") return "Church Admin";
    return role.replace(/_/g, " ");
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-medium">Organization members</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Org role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.organizationMemberships.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{displayName(m.userId)}</TableCell>
                <TableCell>{m.role}</TableCell>
                <TableCell>{m.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Church memberships</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.branchMemberships.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{displayName(m.userId)}</TableCell>
                <TableCell>{churchNameForBranch(m.branchId)}</TableCell>
                <TableCell>{roleLabel(m.role)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
