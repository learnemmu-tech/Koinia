/**
 * Simulates authenticated shell DB fan-out before vs after the performance fix.
 * Does not print credentials. Does not call HTTP APIs.
 *
 * Before: org-ish snapshot queries + routing queries + subscription queries (parallel)
 * After:  org-ish snapshot queries only on critical path (routing derived; subscription deferred)
 */
import fs from "node:fs";
import pg from "pg";

function loadDatabaseUrl() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("DATABASE_URL=")) continue;
      let value = line.slice("DATABASE_URL=".length).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }
  return process.env.DATABASE_URL || "";
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

function ms(start) {
  return Math.round(performance.now() - start);
}

async function withClient(pool, fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function orgLikeWork(client, clerkId) {
  const userRes = await client.query(
    `select id, organization_id, active_church_id from users where clerk_id = $1 limit 1`,
    [clerkId]
  );
  const user = userRes.rows[0];
  if (!user) return;
  await client.query(
    `select * from organization_memberships where user_id = $1`,
    [user.id]
  );
  await client.query(
    `select * from church_memberships where user_id = $1`,
    [user.id]
  );
  if (user.organization_id) {
    await client.query(`select * from organizations where id = $1 limit 1`, [
      user.organization_id,
    ]);
    await client.query(
      `select id from churches where organization_id = $1 and is_active = true`,
      [user.organization_id]
    );
  }
}

async function routingLikeWork(client, clerkId) {
  const userRes = await client.query(
    `select id, organization_id from users where clerk_id = $1 limit 1`,
    [clerkId]
  );
  const user = userRes.rows[0];
  if (!user) return;
  await Promise.all([
    user.organization_id
      ? client.query(
          `select * from organization_memberships where user_id = $1 and organization_id = $2 limit 1`,
          [user.id, user.organization_id]
        )
      : Promise.resolve(),
    client.query(`select * from church_memberships where user_id = $1`, [
      user.id,
    ]),
    user.organization_id
      ? client.query(
          `select count(*)::int as n from churches where organization_id = $1`,
          [user.organization_id]
        )
      : Promise.resolve(),
    user.organization_id
      ? client.query(`select status from organizations where id = $1 limit 1`, [
          user.organization_id,
        ])
      : Promise.resolve(),
  ]);
}

async function subscriptionLikeWork(client, clerkId) {
  const userRes = await client.query(
    `select organization_id from users where clerk_id = $1 limit 1`,
    [clerkId]
  );
  const orgId = userRes.rows[0]?.organization_id;
  if (!orgId) return;
  await client.query(
    `select * from subscriptions where organization_id = $1 limit 1`,
    [orgId]
  );
}

async function rscTenantLikeWork(client, clerkId) {
  const userRes = await client.query(
    `select id, organization_id, active_church_id from users where clerk_id = $1 limit 1`,
    [clerkId]
  );
  const user = userRes.rows[0];
  if (!user?.active_church_id) return;
  const churchRes = await client.query(
    `select id, organization_id, is_active from churches where id = $1 limit 1`,
    [user.active_church_id]
  );
  const church = churchRes.rows[0];
  if (!church) return;
  await Promise.all([
    church.organization_id
      ? client.query(`select status from organizations where id = $1 limit 1`, [
          church.organization_id,
        ])
      : Promise.resolve(),
    church.organization_id
      ? client.query(
          `select id from organization_memberships where user_id = $1 and organization_id = $2 limit 1`,
          [user.id, church.organization_id]
        )
      : Promise.resolve(),
    client.query(
      `select id from church_memberships where user_id = $1 and church_id = $2 limit 1`,
      [user.id, church.id]
    ),
  ]);
}

async function main() {
  const raw = loadDatabaseUrl();
  if (!raw) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(raw),
    max: 10,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  const warm = await withClient(pool, (c) => c.query("select 1"));
  void warm;

  const clerkRes = await withClient(pool, (c) =>
    c.query(
      `select clerk_id from users where organization_id is not null and active_church_id is not null limit 1`
    )
  );
  const clerkId = clerkRes.rows[0]?.clerk_id;
  if (!clerkId) {
    console.error("No sample authenticated user found");
    await pool.end();
    process.exit(1);
  }
  console.log(`sample user: ${String(clerkId).slice(0, 12)}…`);

  // BEFORE: org + routing + subscription + RSC competing
  const beforeStart = performance.now();
  await Promise.all([
    withClient(pool, (c) => orgLikeWork(c, clerkId)),
    withClient(pool, (c) => routingLikeWork(c, clerkId)),
    withClient(pool, (c) => subscriptionLikeWork(c, clerkId)),
    withClient(pool, (c) => rscTenantLikeWork(c, clerkId)),
  ]);
  console.log(`BEFORE critical-path fan-out (org+routing+sub+rsc): ${ms(beforeStart)}ms`);

  // AFTER soft-nav warm shell: only RSC tenant resolve (org/sub/routing cached / deferred / derived)
  const afterSoftStart = performance.now();
  await withClient(pool, (c) => rscTenantLikeWork(c, clerkId));
  console.log(`AFTER warm soft-nav (rsc tenant only): ${ms(afterSoftStart)}ms`);

  // AFTER cold session start: org + RSC (routing derived, subscription deferred)
  const afterColdStart = performance.now();
  await Promise.all([
    withClient(pool, (c) => orgLikeWork(c, clerkId)),
    withClient(pool, (c) => rscTenantLikeWork(c, clerkId)),
  ]);
  console.log(`AFTER cold shell (org+rsc, no routing/sub): ${ms(afterColdStart)}ms`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
