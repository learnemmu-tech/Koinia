import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import { neonConnectionConfig } from "./neon-connection";
import * as schema from "./schema";

const POOL_KEY = "neon-public-dns-v1";

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  pgPoolKey?: string;
};

function getPool(): Pool {
  if (globalForDb.pgPool && globalForDb.pgPoolKey === POOL_KEY) {
    return globalForDb.pgPool;
  }
  if (globalForDb.pgPool) {
    void globalForDb.pgPool.end().catch(() => undefined);
  }

  const connection = neonConnectionConfig(env.DATABASE_URL);
  const pool = new Pool({
    ...connection,
    // Keep serverless pools tiny. Locally allow more concurrency so Next.js
    // compile + RSC fan-out does not exhaust the pool.
    max: process.env.VERCEL ? 1 : 20,
    // A new Neon connection from this network measured 2.3–3.8s.
    // Keep the warm socket across normal gaps between clicks.
    idleTimeoutMillis: process.env.VERCEL ? 20_000 : 300_000,
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
  globalForDb.pgPoolKey = POOL_KEY;

  return pool;
}

export const db = drizzle(getPool(), { schema });

export type Database = typeof db;
