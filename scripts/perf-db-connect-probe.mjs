/**
 * Measures Neon connect + simple query latency. Does not print credentials.
 * Usage: node scripts/perf-db-connect-probe.mjs
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

async function main() {
  const raw = loadDatabaseUrl();
  if (!raw) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const connectionString = normalizeDatabaseUrl(raw);
  console.log(`Neon pooler in URL: ${/-pooler\./i.test(connectionString)}`);

  const pool = new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  const connectStart = performance.now();
  const client = await pool.connect();
  console.log(`first client connect: ${ms(connectStart)}ms`);
  const pingStart = performance.now();
  await client.query("select 1");
  console.log(`select 1: ${ms(pingStart)}ms`);
  client.release();

  // Simulate fan-out of 4 concurrent API-style queries
  const fanStart = performance.now();
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const c = await pool.connect();
      await c.query(
        `select id from users order by created_at desc limit 1`
      );
      c.release();
    })
  );
  console.log(`4 concurrent user lookups: ${ms(fanStart)}ms`);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
