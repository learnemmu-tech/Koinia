/**
 * Development-only reset for a dynamically supplied test user.
 *
 * Does NOT run unless:
 *   - NODE_ENV is not production
 *   - VERCEL_ENV is not production
 *   - --email is provided at runtime
 *   - --confirm is provided
 *
 * Usage:
 *   pnpm dev:reset-user --email="you@example.com" --confirm
 *
 * This script is intentionally not invoked by the application.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClerkClient } from "@clerk/backend";
import pg from "pg";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : "";
}

function isProductionEnv() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function normalizeDatabaseUrl(connectionString) {
  let url = connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i,
    "$1sslmode=verify-full"
  );
  url = url.replace(
    /(@ep-[a-z0-9-]+)(\.(?:[a-z0-9-]+\.)*neon\.tech)/i,
    (match, userHost, rest) => {
      if (/-pooler$/i.test(userHost)) return match;
      return `${userHost}-pooler${rest}`;
    }
  );
  return url;
}

const email = argValue("email").toLowerCase();
const confirmed = process.argv.includes("--confirm");

if (isProductionEnv()) {
  console.error("Refusing to run: this utility is development-only.");
  process.exit(1);
}

if (!email || !email.includes("@")) {
  console.error(
    'Usage: pnpm dev:reset-user --email="you@example.com" --confirm'
  );
  process.exit(1);
}

if (!confirmed) {
  console.error("Refusing to run without --confirm");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: normalizeDatabaseUrl(databaseUrl),
});

const deleted = {
  organizations: [],
  churches: [],
  websites: [],
  memberships: 0,
  invitations: 0,
  groupInvitations: 0,
  user: null,
  clerkUser: null,
};

try {
  await client.connect();
  await client.query("BEGIN");

  const userResult = await client.query(
    `SELECT id, email, clerk_id, organization_id
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email]
  );
  const user = userResult.rows[0];
  if (!user) {
    await client.query("ROLLBACK");
    console.error(`No application user found for ${email}`);
    process.exit(1);
  }

  const orgResult = await client.query(
    `SELECT id, name
     FROM organizations
     WHERE owner_id = $1`,
    [user.id]
  );
  const orgIds = orgResult.rows.map((row) => row.id);
  deleted.organizations = orgResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));

  if (orgIds.length > 0) {
    const churchResult = await client.query(
      `SELECT id, name, join_slug, organization_id
       FROM churches
       WHERE organization_id = ANY($1::uuid[])`,
      [orgIds]
    );
    deleted.churches = churchResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      joinSlug: row.join_slug,
    }));

    const websiteResult = await client.query(
      `SELECT id, church_id, active_template
       FROM church_websites
       WHERE organization_id = ANY($1::uuid[])`,
      [orgIds]
    );
    deleted.websites = websiteResult.rows.map((row) => ({
      id: row.id,
      churchId: row.church_id,
      activeTemplate: row.active_template,
    }));
  }

  await client.query(
    `UPDATE users
     SET organization_id = NULL,
         active_church_id = NULL,
         pending_church_id = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [user.id]
  );

  const invitationDelete = await client.query(
    `DELETE FROM invitations
     WHERE invited_by = $1
        OR accepted_by = $1
        OR ($2::uuid[] IS NOT NULL AND organization_id = ANY($2::uuid[]))`,
    [user.id, orgIds]
  );
  deleted.invitations = invitationDelete.rowCount ?? 0;

  const groupInvitationDelete = await client.query(
    `DELETE FROM church_group_invitations
     WHERE invited_by = $1
        OR user_id = $1
        OR ($2::uuid[] IS NOT NULL AND organization_id = ANY($2::uuid[]))`,
    [user.id, orgIds]
  );
  deleted.groupInvitations = groupInvitationDelete.rowCount ?? 0;

  if (orgIds.length > 0) {
    await client.query(`DELETE FROM organizations WHERE id = ANY($1::uuid[])`, [
      orgIds,
    ]);
  }

  const orgMembershipDelete = await client.query(
    `DELETE FROM organization_memberships WHERE user_id = $1`,
    [user.id]
  );
  const churchMembershipDelete = await client.query(
    `DELETE FROM church_memberships WHERE user_id = $1`,
    [user.id]
  );
  deleted.memberships =
    (orgMembershipDelete.rowCount ?? 0) + (churchMembershipDelete.rowCount ?? 0);

  await client.query(`DELETE FROM users WHERE id = $1`, [user.id]);
  deleted.user = { id: user.id, email: user.email, clerkId: user.clerk_id };

  await client.query("COMMIT");

  if (user.clerk_id && process.env.CLERK_SECRET_KEY) {
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      await clerk.users.deleteUser(user.clerk_id);
      deleted.clerkUser = user.clerk_id;
    } catch (error) {
      console.error(
        "PostgreSQL records were deleted, but Clerk user deletion failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("Deleted development records for runtime email:");
  console.log(JSON.stringify(deleted, null, 2));
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback errors if the connection already failed.
  }
  console.error(
    error instanceof Error ? error.message : "Failed to reset development user."
  );
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
