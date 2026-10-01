import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

import { normalizeDatabaseUrl } from "./src/db/normalize-database-url";

function loadEnvFile(path: string, override: boolean) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env", false);
loadEnvFile(".env.local", true);

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: normalizeDatabaseUrl(
      process.env.DATABASE_URL ??
        "postgresql://postgres@localhost:5432/faithconnecthub"
    ),
  },
  strict: true,
  verbose: true,
});
