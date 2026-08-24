"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Link2, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { FirebaseInvitation } from "@/types/invitation";
import type { MembershipRole } from "@/types/membership";

const INVITE_ROLES: { value: MembershipRole; label: string }[] = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "church_admin", label: "Church Admin" },
  { value: "branch_admin", label: "Church Admin" },
  { value: "leader", label: "Leader" },
  { value: "editor", label: "Editor" },
  { value: "member", label: "Member" },
  { value: "volunteer", label: "Volunteer" },
];

export function OrganizationInvitationsPanel() {
  const { organization, churches, branchesByChurch } = useOrganization();
  const churchId = useAdminChurchId();
  const church = churches.find((c) => c.id === churchId) ?? churches[0];
  const branches = church ? (branchesByChurch[church.id] ?? []) : [];
  const defaultBranch = branches.find((b) => b.isDefault) ?? branches[0];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");
  const [branchId, setBranchId] = useState(defaultBranch?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<FirebaseInvitation[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    if (!organization) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    setListLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/invitations?organizationId=${encodeURIComponent(organization.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = (await res.json()) as { invitations: FirebaseInvitation[] };
        setInvitations(data.invitations);
      }
    } finally {
      setListLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    if (defaultBranch && !branchId) setBranchId(defaultBranch.id);
  }, [defaultBranch, branchId]);

  async function createInvite(method: "email" | "link") {
    if (!organization || !church || !branchId) {
      toast.error("Select a church first");
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user) return;

    if (method === "email" && !email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organization.id,
          churchId: church.id,
          branchId,
          role,
          email: method === "email" ? email.trim() : undefined,
          deliveryMethod: method,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to create invitation");
      }

      const data = (await res.json()) as {
        inviteLink?: string;
        emailSent?: boolean;
        message?: string;
      };

      if (method === "link" && data.inviteLink) {
        await navigator.clipboard.writeText(data.inviteLink);
        toast.success("Invitation link copied");
      } else if (method === "email" && data.emailSent === false && data.inviteLink) {
        toast.warning(data.message ?? "Invitation created but email failed to send.", {
          description: data.inviteLink,
          duration: 12000,
        });
        setEmail("");
      } else if (method === "email") {
        toast.success("Invitation sent");
        setEmail("");
      }
      await loadInvitations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 size-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="link">
            <Link2 className="mr-2 size-4" />
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4 space-y-4 max-w-lg">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Church</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as MembershipRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@church.org"
            />
          </div>
          <Button disabled={loading} onClick={() => void createInvite("email")}>
            {loading ?
              <Loader2 className="mr-2 size-4 animate-spin" />
            : null}
            Send invitation
          </Button>
        </TabsContent>

        <TabsContent value="link" className="mt-4 space-y-4 max-w-lg">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Church</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as MembershipRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => void createInvite("link")}
          >
            <Copy className="mr-2 size-4" />
            Generate link
          </Button>
        </TabsContent>
      </Tabs>

      <div>
        <h3 className="mb-3 text-sm font-medium">Pending invitations</h3>
        {listLoading ?
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        : invitations.length === 0 ?
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email ?? "Link invitation"}</TableCell>
                  <TableCell>{inv.role}</TableCell>
                  <TableCell>{inv.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </div>
    </div>
  );
}
