import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { canAccessOrganizationWorkspace } from "@/lib/auth/organization-workspace-access";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { isPostgresUuid } from "@/lib/postgres/uuid";

export const getOrganizationAccessStatus = cache(
  async (organizationId: string): Promise<string | null> => {
    const id = organizationId.trim();
    if (!isPostgresUuid(id)) return null;

    const [row] = await db
      .select({ status: organizations.status })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return row?.status ?? null;
  }
);

/**
 * SuperAdmin always bypasses organization suspension.
 * Missing organization IDs are not treated as suspended (other auth handles that).
 */
export async function organizationAllowsWorkspaceAccess(
  organizationId: string | null | undefined,
  platformRole: string | null | undefined
): Promise<boolean> {
  if (isPlatformSuperAdmin(platformRole)) return true;
  const orgId = organizationId?.trim();
  if (!orgId) return true;

  const status = await getOrganizationAccessStatus(orgId);
  return canAccessOrganizationWorkspace({
    platformRole,
    organizationStatus: status,
  });
}
