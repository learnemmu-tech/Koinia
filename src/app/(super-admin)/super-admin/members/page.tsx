import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import { SuperAdminMembersFilters } from "@/components/super-admin/super-admin-members-filters";
import {
  SuperAdminEmptyPanel,
  SuperAdminTableShell,
} from "@/components/super-admin/super-admin-section";
import { PlatformRoleBadge } from "@/components/super-admin/super-admin-status-badges";
import { Badge } from "@/components/ui/badge";
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
  formatMembershipStatus,
  formatShortDate,
} from "@/lib/super-admin/labels";
import { listSuperAdminMembers } from "@/lib/super-admin/queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildMembersHref(params: Record<string, string>, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value.trim()) search.set(key, value.trim());
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query
    ? `${SUPER_ADMIN_BASE}/members?${query}`
    : `${SUPER_ADMIN_BASE}/members`;
}

export default async function SuperAdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const organizationId = firstParam(raw.organizationId);
  const churchId = firstParam(raw.churchId);
  const platformRole = firstParam(raw.platformRole);
  const page = Number.parseInt(firstParam(raw.page), 10) || 1;

  const result = await listSuperAdminMembers({
    q,
    organizationId,
    churchId,
    platformRole,
    page,
  });

  const filterParams = { q, organizationId, churchId, platformRole };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Platform users"
        description="Accounts in the users table with organization and church membership context. Platform users are not the same as church memberships."
      />

      <SuperAdminMembersFilters
        q={q}
        organizationId={organizationId}
        churchId={churchId}
        platformRole={platformRole}
      />

      {result.items.length === 0 ? (
        <SuperAdminEmptyPanel
          title="No users found"
          description="Try a different search or clear the filters."
        />
      ) : (
        <>
          <SuperAdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Platform role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Churches</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="min-w-[140px] font-medium">
                      {member.displayName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <PlatformRoleBadge role={member.platformRole} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.organizationName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {member.churchNames.length > 0
                        ? member.churchNames.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {member.membershipStatus ? (
                        <Badge variant="outline" className="font-normal">
                          {formatMembershipStatus(member.membershipStatus)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(member.createdAt)}
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
            buildHref={(nextPage) => buildMembersHref(filterParams, nextPage)}
          />
        </>
      )}
    </div>
  );
}
