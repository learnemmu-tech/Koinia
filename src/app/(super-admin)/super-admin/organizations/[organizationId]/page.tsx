import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SuperAdminKpiRow } from "@/components/super-admin/super-admin-kpi-row";
import { SuperAdminOrganizationAccessControls } from "@/components/super-admin/super-admin-organization-access-controls";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import {
  SuperAdminEmptyPanel,
  SuperAdminSection,
  SuperAdminTableShell,
} from "@/components/super-admin/super-admin-section";
import {
  ChurchStatusBadge,
  OrganizationAccessBadge,
  PlanBadge,
  SubscriptionStatusBadge,
} from "@/components/super-admin/super-admin-status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import {
  formatShortDate,
  formatWorkspaceType,
} from "@/lib/super-admin/labels";
import { getSuperAdminOrganizationDetail } from "@/lib/super-admin/queries";

export default async function SuperAdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const detail = await getSuperAdminOrganizationDetail(organizationId);
  if (!detail) notFound();

  const { organization, churches, members, content } = detail;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href={`${SUPER_ADMIN_BASE}/organizations`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Organizations
        </Link>
        <SuperAdminPageHeader
          title={organization.name}
          description="Organization inspection workspace. Suspend or activate access without changing subscription records or deleting data."
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaField label="Type" value={formatWorkspaceType(organization.workspaceType)} />
          <MetaField label="Created" value={formatShortDate(organization.createdAt)} />
          <MetaField
            label="Plan"
            value={<PlanBadge planId={organization.planId} />}
          />
          <MetaField
            label="Subscription"
            value={
              <SubscriptionStatusBadge status={organization.subscriptionStatus} />
            }
          />
          <MetaField
            label="Organization access"
            value={<OrganizationAccessBadge status={organization.status} />}
          />
        </div>
        <div className="mt-4 border-t border-border/40 pt-4">
          <SuperAdminOrganizationAccessControls
            organizationId={organization.id}
            accessStatus={organization.status}
          />
        </div>
      </div>

      <SuperAdminSection title="Organization summary">
        <SuperAdminKpiRow
          items={[
            { label: "Churches", value: churches.length },
            { label: "Church members", value: members.total },
            { label: "Active members", value: members.active },
            { label: "Pending members", value: members.pending },
            { label: "Songs", value: content.songs },
            { label: "Sermons", value: content.sermons },
          ]}
        />
      </SuperAdminSection>

      <SuperAdminSection
        title="Churches"
        description="All churches belonging to this organization."
      >
        {churches.length === 0 ? (
          <SuperAdminEmptyPanel title="This organization has no churches yet." />
        ) : (
          <SuperAdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`${SUPER_ADMIN_BASE}/churches/${church.id}`}
                        className="hover:underline"
                      >
                        {church.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ChurchStatusBadge isActive={church.isActive} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {church.memberCount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(church.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SuperAdminTableShell>
        )}
      </SuperAdminSection>

      <SuperAdminSection title="Content totals">
        <SuperAdminKpiRow
          items={[
            { label: "Articles", value: content.articles },
            { label: "Events", value: content.events },
            { label: "Prayer requests", value: content.prayerRequests },
            { label: "Donations", value: content.donations },
            { label: "Shorts", value: content.shorts },
            { label: "Suspended members", value: members.suspended },
          ]}
        />
      </SuperAdminSection>
    </div>
  );
}

function MetaField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
