import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { churchGroups } from "@/db/schema";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import type { PublicMinistrySummary } from "@/lib/templates/types";

export async function listPublicChurchMinistries(input: {
  churchId: string;
  organizationId: string;
  limit?: number;
}): Promise<PublicMinistrySummary[]> {
  if (!isPostgresUuid(input.churchId) || !isPostgresUuid(input.organizationId)) {
    return [];
  }

  const limit = Math.min(Math.max(input.limit ?? 8, 1), 24);
  const rows = await db
    .select({
      id: churchGroups.id,
      name: churchGroups.name,
      description: churchGroups.description,
      imageUrl: churchGroups.imageUrl,
    })
    .from(churchGroups)
    .where(
      and(
        eq(churchGroups.churchId, input.churchId),
        eq(churchGroups.organizationId, input.organizationId),
        eq(churchGroups.status, "active")
      )
    )
    .orderBy(desc(churchGroups.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description?.trim() ?? "",
    imageUrl: row.imageUrl?.trim() || undefined,
  }));
}
