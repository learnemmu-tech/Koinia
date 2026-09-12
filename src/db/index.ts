import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import { normalizeDatabaseUrl } from "./normalize-database-url";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
};

function getPool(): Pool {
  if (globalForDb.pgPool) {
    return globalForDb.pgPool;
  }

  const pool = new Pool({
    connectionString: normalizeDatabaseUrl(env.DATABASE_URL),
    // Keep serverless pools tiny. Locally allow more concurrency so bootstrap
    // API fan-out (org + routing + subscription + badges) does not queue for
    // tens of seconds behind a 5-connection stampede.
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  pool.on("error", (error) => {
    console.error("[postgres] Unexpected pool client error", error);
  });

  globalForDb.pgPool = pool;

  return pool;
}

export const db = drizzle(getPool(), { schema });

export type Database = typeof db;
