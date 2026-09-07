import Link from "next/link";

import { SuperAdminOrganizationsFilters } from "@/components/super-admin/super-admin-organizations-filters";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import {
  SuperAdminEmptyPanel,
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
import { listSuperAdminOrganizations } from "@/lib/super-admin/queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildOrganizationsHref(
  params: Record<string, string>,
  page: number
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value.trim()) search.set(key, value.trim());
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query
    ? `${SUPER_ADMIN_BASE}/organizations?${query}`
    : `${SUPER_ADMIN_BASE}/organizations`;
}

export default async function SuperAdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const workspaceType = firstParam(raw.workspaceType);
  const status = firstParam(raw.status);
  const planId = firstParam(raw.planId);
  const subscriptionStatus = firstParam(raw.subscriptionStatus);
  const page = Number.parseInt(firstParam(raw.page), 10) || 1;

  const result = await listSuperAdminOrganizations({
    q,
    workspaceType,
    status,
    planId,
    subscriptionStatus,
    page,
  });

  const filterParams = {
    q,
    workspaceType,
    status,
    planId,
    subscriptionStatus,
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Organizations"
        description="Manage and inspect every customer workspace on the platform. Filters and pagination run server-side in PostgreSQL."
      />

      <SuperAdminOrganizationsFilters
        q={q}
        workspaceType={workspaceType}
        status={status}
        planId={planId}
        subscriptionStatus={subscriptionStatus}
      />

      {result.items.length === 0 ? (
        <SuperAdminEmptyPanel
          title="No organizations found"
          description="Try a different search or clear the filters."
        />
      ) : (
        <>
          <SuperAdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Churches</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="min-w-[180px] font-medium">
                      <Link
                        href={`${SUPER_ADMIN_BASE}/organizations/${org.id}`}
                        className="hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatWorkspaceType(org.workspaceType)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {org.churchCount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {org.memberCount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <PlanBadge planId={org.planId} />
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={org.subscriptionStatus} />
                    </TableCell>
                    <TableCell>
                      <OrganizationAccessBadge status={org.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(org.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SuperAdminTableShell>

          <SuperAdminPagination
            page={result.page}
            totalPages={result.totalPages}
            totalItems={result.total}
            buildHref={(nextPage) =>
              buildOrganizationsHref(filterParams, nextPage)
            }
          />
        </>
      )}
    </div>
  );
}
