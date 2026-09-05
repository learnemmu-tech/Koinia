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
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
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
