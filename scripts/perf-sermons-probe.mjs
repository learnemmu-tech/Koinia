/**
 * One-shot sermons performance probe (local/prod DB via env).
 * Does not print DATABASE_URL or credentials.
 *
 * Usage: node --env-file=.env.local scripts/perf-sermons-probe.mjs
 */
import pg from "pg";

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

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const connectionString = normalizeDatabaseUrl(raw);
  const usingPooler = /-pooler\./i.test(connectionString);
  console.log(`Neon pooler in URL: ${usingPooler}`);

  const connectStart = performance.now();
  const pool = new pg.Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });
  const client = await pool.connect();
  console.log(`DB connect (first client): ${ms(connectStart)} ms`);

  const pingStart = performance.now();
  await client.query("select 1");
  console.log(`DB ping select 1: ${ms(pingStart)} ms`);

  const countStart = performance.now();
  const countRes = await client.query(
    `select count(*)::int as n from sermons where is_published = true`
  );
  console.log(
    `Published sermon count query: ${ms(countStart)} ms (count=${countRes.rows[0]?.n})`
  );

  const listStart = performance.now();
  const listRes = await client.query(
    `select id, title, speaker, created_by, created_at
     from sermons
     where is_published = true
     order by created_at desc
     limit 50`
  );
  console.log(
    `Published sermons list (limit 50): ${ms(listStart)} ms (rows=${listRes.rows.length})`
  );

  const creatorIds = [
    ...new Set(listRes.rows.map((r) => r.created_by).filter(Boolean)),
  ];
  const clerkStart = performance.now();
  if (creatorIds.length > 0) {
    await client.query(
      `select id, clerk_id from users where id = any($1::uuid[])`,
      [creatorIds]
    );
  }
  console.log(
    `Creator clerk-id lookup (${creatorIds.length} ids): ${ms(clerkStart)} ms`
  );

  const userStart = performance.now();
  await client.query(`select id from users order by created_at desc limit 1`);
  console.log(`Sample users lookup: ${ms(userStart)} ms`);

  const churchStart = performance.now();
  await client.query(`select id, organization_id from churches where is_active = true limit 1`);
  console.log(`Sample church lookup: ${ms(churchStart)} ms`);

  const secondConnectStart = performance.now();
  const client2 = await pool.connect();
  await client2.query("select 1");
  client2.release();
  console.log(`Second pooled client checkout+ping: ${ms(secondConnectStart)} ms`);

  client.release();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
