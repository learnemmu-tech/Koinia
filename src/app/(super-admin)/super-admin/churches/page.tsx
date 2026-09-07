import Link from "next/link";

import { SuperAdminChurchesFilters } from "@/components/super-admin/super-admin-churches-filters";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import {
  SuperAdminEmptyPanel,
  SuperAdminTableShell,
} from "@/components/super-admin/super-admin-section";
import { ChurchStatusBadge } from "@/components/super-admin/super-admin-status-badges";
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
import { listSuperAdminChurches } from "@/lib/super-admin/queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildChurchesHref(params: Record<string, string>, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value.trim()) search.set(key, value.trim());
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query
    ? `${SUPER_ADMIN_BASE}/churches?${query}`
    : `${SUPER_ADMIN_BASE}/churches`;
}

export default async function SuperAdminChurchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const organizationQ = firstParam(raw.organizationQ);
  const isActive = firstParam(raw.isActive);
  const page = Number.parseInt(firstParam(raw.page), 10) || 1;

  const result = await listSuperAdminChurches({
    q,
    organizationQ,
    isActive,
    page,
  });

  const filterParams = { q, organizationQ, isActive };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Churches"
        description="Platform-wide church directory. Every record is scoped to its parent organization."
      />

      <SuperAdminChurchesFilters
        q={q}
        organizationQ={organizationQ}
        isActive={isActive}
      />

      {result.items.length === 0 ? (
        <SuperAdminEmptyPanel
          title="No churches found"
          description="Try a different search or clear the filters."
        />
      ) : (
        <>
          <SuperAdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="min-w-[160px] font-medium">
                      <Link
                        href={`${SUPER_ADMIN_BASE}/churches/${church.id}`}
                        className="hover:underline"
                      >
                        {church.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${SUPER_ADMIN_BASE}/organizations/${church.organizationId}`}
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {church.organizationName}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatWorkspaceType(church.workspaceType)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {church.memberCount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <ChurchStatusBadge isActive={church.isActive} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(church.createdAt)}
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
            buildHref={(nextPage) => buildChurchesHref(filterParams, nextPage)}
          />
        </>
      )}
    </div>
  );
}
