"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import { AddChurchModal } from "@/components/admin/add-church-modal";
import { InviteChurchAdminDialog } from "@/components/admin/invite-church-admin-dialog";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlanBadgeFromContext } from "@/components/subscription/plan-badge-from-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import type { FirebaseChurch } from "@/types/firebase-church";

type ChurchCardStats = {
  memberCount: number;
  adminName: string;
};

function formatLocation(church: FirebaseChurch): string {
  return [church.city, church.state, church.country].filter(Boolean).join(", ");
}

function useChurchCardStats(): Record<string, ChurchCardStats> {
  const { churches, branchMemberships } = useOrganization();

  return useMemo(() => {
    const stats: Record<string, ChurchCardStats> = {};

    for (const church of churches) {
      const members = branchMemberships.filter(
        (membership) =>
          membership.churchId === church.id && membership.status === "active"
      );
      const adminMembership =
        members.find((membership) =>
          ["church_admin", "branch_admin", "org_admin", "owner"].includes(
            membership.role
          )
        ) ?? members[0];

      stats[church.id] = {
        memberCount: members.length,
        adminName: church.pastorName?.trim() || adminMembership?.role || "—",
      };
    }

    return stats;
  }, [churches, branchMemberships]);
}

export function MultiOrgDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser } = useFirebaseAuth();
  const { setActiveChurchId } = useActiveChurch();
  const {
    organization,
    churches,
    branchesByChurch,
    loading,
    refetch,
  } = useOrganization();
  const churchStats = useChurchCardStats();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<{
    churchId: string;
    branchId: string;
    churchName: string;
  } | null>(null);

  const orgName = organization?.name?.trim() || "your organization";
  const hasChurches = churches.length > 0;

  useEffect(() => {
    const churchId = searchParams.get("churchId")?.trim();
    if (churchId) {
      setActiveChurchId(churchId);
    }
    if (searchParams.get("createChurch") === "1") {
      setCreateModalOpen(true);
      router.replace("/dashboard");
    }
  }, [searchParams, setActiveChurchId, router]);

  function openChurchSettings(churchId: string) {
    setActiveChurchId(churchId);
    router.push("/dashboard/church-settings");
  }

  function openChurchDashboard(churchId: string) {
    setActiveChurchId(churchId);
    router.push("/dashboard/content");
  }

  if (loading && !organization) {
    return (
      <div className={`${adminSectionClass} flex justify-center py-20`}>
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        eyebrow="Organization"
        title="Dashboard"
        description={`${orgName} · manage churches across your organization`}
      >
        <PlanBadgeFromContext />
      </AdminPageHeader>

      {!hasChurches ?
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-8" />
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Welcome to {orgName}
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Start by creating your first church. You can invite church admins and
            manage each church separately from here.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Create Your First Church
          </Button>
        </div>
      : <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Your churches</h2>
              <p className="text-sm text-muted-foreground">
                {churches.length} church{churches.length === 1 ? "" : "es"} in
                this organization
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Church
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {churches.map((church) => {
              const location = formatLocation(church);
              const stats = churchStats[church.id];

              return (
                <Card key={church.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{church.name}</CardTitle>
                    {location ?
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        {location}
                      </CardDescription>
                    : null}
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Members</p>
                        <p className="flex items-center gap-1 font-medium">
                          <Users className="size-3.5" />
                          {stats?.memberCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Admin</p>
                        <p className="truncate font-medium">
                          {stats?.adminName ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => openChurchDashboard(church.id)}
                      >
                        <ExternalLink className="mr-1.5 size-3.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openChurchSettings(church.id)}
                      >
                        <Settings className="mr-1.5 size-3.5" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      }

      {organization && authUser ?
        <>
          <AddChurchModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSave={async (created) => {
              await refetch();
              if (created?.churchId) {
                const branchId =
                  created.branchId ??
                  branchesByChurch[created.churchId]?.find((b) => b.isDefault)
                    ?.id ??
                  branchesByChurch[created.churchId]?.[0]?.id;
                const church =
                  churches.find((c) => c.id === created.churchId) ??
                  ({ id: created.churchId, name: "your church" } as FirebaseChurch);

                if (branchId) {
                  setInviteTarget({
                    churchId: created.churchId,
                    branchId,
                    churchName: church.name,
                  });
                }
              }
            }}
            organizationId={organization.id}
            userId={authUser.uid}
            userEmail={authUser.email}
          />

          {inviteTarget ?
            <InviteChurchAdminDialog
              open={Boolean(inviteTarget)}
              onOpenChange={(open) => {
                if (!open) setInviteTarget(null);
              }}
              organizationId={organization.id}
              churchId={inviteTarget.churchId}
              branchId={inviteTarget.branchId}
              churchName={inviteTarget.churchName}
            />
          : null}
        </>
      : null}
    </div>
  );
}
