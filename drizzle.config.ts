import { defineConfig } from "drizzle-kit";

import { normalizeDatabaseUrl } from "./src/db/normalize-database-url";

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
