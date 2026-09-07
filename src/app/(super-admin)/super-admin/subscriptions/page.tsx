import Link from "next/link";

import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import { SuperAdminSubscriptionsFilters } from "@/components/super-admin/super-admin-subscriptions-filters";
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
  formatPeriodRange,
  formatShortDate,
} from "@/lib/super-admin/labels";
import { listSuperAdminSubscriptions } from "@/lib/super-admin/queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildSubscriptionsHref(
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
    ? `${SUPER_ADMIN_BASE}/subscriptions?${query}`
    : `${SUPER_ADMIN_BASE}/subscriptions`;
}

export default async function SuperAdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const planId = firstParam(raw.planId);
  const subscriptionStatus = firstParam(raw.subscriptionStatus);
  const organizationAccess = firstParam(raw.organizationAccess);
  const page = Number.parseInt(firstParam(raw.page), 10) || 1;

  const result = await listSuperAdminSubscriptions({
    q,
    planId,
    subscriptionStatus,
    organizationAccess,
    page,
  });

  const filterParams = {
    q,
    planId,
    subscriptionStatus,
    organizationAccess,
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Subscriptions"
        description="Organization-level subscriptions from PostgreSQL. Access controls are managed separately on each organization."
      />

      <SuperAdminSubscriptionsFilters
        q={q}
        planId={planId}
        subscriptionStatus={subscriptionStatus}
        organizationAccess={organizationAccess}
      />

      {result.items.length === 0 ? (
        <SuperAdminEmptyPanel
          title="No subscriptions found"
          description="Try a different search or clear the filters."
        />
      ) : (
        <>
          <SuperAdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Current period</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="min-w-[180px] font-medium">
                      <Link
                        href={`${SUPER_ADMIN_BASE}/organizations/${sub.organizationId}`}
                        className="hover:underline"
                      >
                        {sub.organizationName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanBadge planId={sub.planId} />
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.subscriptionStatus} />
                    </TableCell>
                    <TableCell>
                      <OrganizationAccessBadge status={sub.organizationAccess} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatPeriodRange(
                        sub.currentPeriodStart,
                        sub.currentPeriodEnd
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(sub.createdAt)}
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
              buildSubscriptionsHref(filterParams, nextPage)
            }
          />
        </>
      )}
    </div>
  );
}
