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
    // Keep serverless pools tiny. Locally allow more concurrency so Next.js
    // compile + RSC fan-out does not exhaust the pool.
    max: process.env.VERCEL ? 1 : 20,
    idleTimeoutMillis: 20_000,
    // Wait for a free pooled client instead of failing while a sibling
    // request (pricing, dashboard compile) still holds connections.
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });

  pool.on("error", (error) => {
    console.error("[postgres] Unexpected pool client error", error);
  });

  globalForDb.pgPool = pool;

  return pool;
}

export const db = drizzle(getPool(), { schema });

export type Database = typeof db;
