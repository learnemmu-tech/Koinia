import Link from "next/link";

import { SuperAdminKpiRow } from "@/components/super-admin/super-admin-kpi-row";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import {
  SuperAdminEmptyPanel,
  SuperAdminSection,
  SuperAdminTableShell,
} from "@/components/super-admin/super-admin-section";
import {
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
import { getSuperAdminPlatformOverview } from "@/lib/super-admin/queries";

export default async function SuperAdminOverviewPage() {
  const stats = await getSuperAdminPlatformOverview();
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <SuperAdminPageHeader
        title="Platform overview"
        description="Cross-tenant visibility for organizations, churches, users, content, and access health across FaithConnectHub."
        meta={`Snapshot generated ${generatedAt}`}
      />

      <SuperAdminKpiRow
        items={[
          {
            label: "Organizations",
            value: stats.totalOrganizations,
            hint: `${stats.activeOrganizations} active`,
          },
          {
            label: "Churches",
            value: stats.totalChurches,
            hint: `${stats.activeChurches} active`,
          },
          {
            label: "Platform users",
            value: stats.totalPlatformUsers,
          },
          {
            label: "Church members",
            value: stats.totalChurchMembers,
            hint: "Distinct memberships",
          },
          {
            label: "Suspended orgs",
            value: stats.suspendedOrganizations,
            tone: stats.suspendedOrganizations > 0 ? "warning" : "default",
          },
          {
            label: "Inactive churches",
            value: stats.inactiveChurches,
            tone: stats.inactiveChurches > 0 ? "warning" : "default",
          },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <SuperAdminSection
          title="Recent organizations"
          description="Latest organizations created on the platform."
          action={
            <Link
              href={`${SUPER_ADMIN_BASE}/organizations`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          {stats.recentOrganizations.length === 0 ? (
            <SuperAdminEmptyPanel title="No organizations yet" />
          ) : (
            <SuperAdminTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Churches</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead>Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`${SUPER_ADMIN_BASE}/organizations/${org.id}`}
                          className="hover:underline"
                        >
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatWorkspaceType(org.workspaceType)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {org.churchCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {org.memberCount}
                      </TableCell>
                      <TableCell>
                        <OrganizationAccessBadge status={org.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SuperAdminTableShell>
          )}
        </SuperAdminSection>

        <SuperAdminSection
          title="Access requiring attention"
          description="Organizations currently suspended from workspace access."
          action={
            stats.suspendedOrganizations > 0 ? (
              <Link
                href={`${SUPER_ADMIN_BASE}/organizations?status=suspended`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Review suspended
              </Link>
            ) : null
          }
        >
          {stats.attentionOrganizations.length === 0 ? (
            <SuperAdminEmptyPanel
              title="No suspended organizations"
              description="All organizations currently have workspace access."
            />
          ) : (
            <SuperAdminTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.attentionOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`${SUPER_ADMIN_BASE}/organizations/${org.id}`}
                          className="hover:underline"
                        >
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlanBadge planId={org.planId} />
                      </TableCell>
                      <TableCell>
                        <SubscriptionStatusBadge status={org.subscriptionStatus} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatShortDate(org.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SuperAdminTableShell>
          )}
        </SuperAdminSection>
      </div>

      <SuperAdminSection
        title="Platform content"
        description="Aggregate content totals across all organizations."
      >
        <SuperAdminKpiRow
          items={[
            { label: "Songs", value: stats.content.songs },
            { label: "Sermons", value: stats.content.sermons },
            { label: "Articles", value: stats.content.articles },
            { label: "Events", value: stats.content.events },
            { label: "Prayer requests", value: stats.content.prayerRequests },
            { label: "Shorts", value: stats.content.shorts },
          ]}
        />
      </SuperAdminSection>
    </div>
  );
}
