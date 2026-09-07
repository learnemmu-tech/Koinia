import Link from "next/link";

import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import {
  SuperAdminEmptyPanel,
  SuperAdminSection,
  SuperAdminTableShell,
} from "@/components/super-admin/super-admin-section";
import { PlatformRoleBadge } from "@/components/super-admin/super-admin-status-badges";
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
import { searchSuperAdminPlatform } from "@/lib/super-admin/queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SuperAdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = firstParam(raw.q);
  const results = q ? await searchSuperAdminPlatform(q) : null;

  return (
    <div className="space-y-8">
      <SuperAdminPageHeader
        title="Platform search"
        description={
          q
            ? `Results for “${q}” across organizations, churches, and platform users.`
            : "Enter a query in the search box to find organizations, churches, or platform users."
        }
      />

      {!q ? (
        <SuperAdminEmptyPanel
          title="Start typing to search"
          description="Use the search field in the console header."
        />
      ) : (
        <>
          <SuperAdminSection title="Organizations">
            {results!.organizations.length === 0 ? (
              <SuperAdminEmptyPanel title="No matching organizations" />
            ) : (
              <SuperAdminTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results!.organizations.map((org) => (
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
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(org.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SuperAdminTableShell>
            )}
          </SuperAdminSection>

          <SuperAdminSection title="Churches">
            {results!.churches.length === 0 ? (
              <SuperAdminEmptyPanel title="No matching churches" />
            ) : (
              <SuperAdminTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Church</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results!.churches.map((church) => (
                      <TableRow key={church.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`${SUPER_ADMIN_BASE}/churches/${church.id}`}
                            className="hover:underline"
                          >
                            {church.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {church.organizationName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(church.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SuperAdminTableShell>
            )}
          </SuperAdminSection>

          <SuperAdminSection title="Platform users">
            {results!.members.length === 0 ? (
              <SuperAdminEmptyPanel title="No matching users" />
            ) : (
              <SuperAdminTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results!.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.displayName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <PlatformRoleBadge role={member.platformRole} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SuperAdminTableShell>
            )}
          </SuperAdminSection>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`${SUPER_ADMIN_BASE}/organizations?q=${encodeURIComponent(q)}`}
              className="text-primary hover:underline"
            >
              View all organization matches
            </Link>
            <Link
              href={`${SUPER_ADMIN_BASE}/churches?q=${encodeURIComponent(q)}`}
              className="text-primary hover:underline"
            >
              View all church matches
            </Link>
            <Link
              href={`${SUPER_ADMIN_BASE}/members?q=${encodeURIComponent(q)}`}
              className="text-primary hover:underline"
            >
              View all user matches
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
