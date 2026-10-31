import "server-only";

import { and, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

const CONNECTION_ACTION = "client.connection";
const DEDUPE_MS = 12 * 60 * 60 * 1000;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

type ConnectionUser = {
  id: string;
  organizationId: string | null;
  activeChurchId: string | null;
};

function firstHop(value: string | null): string | null {
  const hop = value?.split(",")[0]?.trim() ?? "";
  if (!hop || hop.length > 64) return null;
  if (!/^[0-9a-fA-F:.]+$/.test(hop)) return null;
  return hop;
}

/**
 * Connection audit retention: rows are deduped for 12 hours and are not
 * exposed by application APIs. Operators should delete `client.connection`
 * audit rows older than 90 days. The address is taken from the platform
 * forwarding header, not from a client-supplied body field.
 */
export function clientIpFromRequest(request: Request): string | null {
  return (
    firstHop(request.headers.get("x-vercel-forwarded-for")) ??
    firstHop(request.headers.get("x-real-ip")) ??
    firstHop(request.headers.get("x-forwarded-for"))
  );
}

/**
 * Records a connection in audit_logs. Called from POST /api/auth/sync-profile
 * after the application user exists. The address comes only from proxy headers.
 * The same user and address are not written again for 12 hours.
 */
export async function recordClientConnection(
  request: Request,
  appUser: ConnectionUser
): Promise<void> {
  const ipAddress = clientIpFromRequest(request);
  if (!ipAddress) return;

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const since = new Date(Date.now() - DEDUPE_MS);
  const recent = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.actorUserId, appUser.id),
        eq(auditLogs.action, CONNECTION_ACTION),
        gt(auditLogs.createdAt, since),
        sql`${auditLogs.metadata}->>'ipAddress' = ${ipAddress}`
      )
    )
    .limit(1);
  if (recent[0]) return;

  await db.insert(auditLogs).values({
    actorUserId: appUser.id,
    action: CONNECTION_ACTION,
    organizationId: appUser.organizationId,
    churchId: appUser.activeChurchId,
    entityType: "user",
    entityId: appUser.id,
    metadata: { ipAddress, userAgent },
  });
}

/** Deletes connection audits older than 90 days. Called from the trial cron. */
export async function purgeExpiredConnectionAudits(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  const removed = await db
    .delete(auditLogs)
    .where(
      and(
        eq(auditLogs.action, CONNECTION_ACTION),
        lt(auditLogs.createdAt, cutoff)
      )
    )
    .returning({ id: auditLogs.id });
  return removed.length;
}
