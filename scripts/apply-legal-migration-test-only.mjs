import { readFileSync } from "node:fs";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
const configured = new URL(databaseUrl).pathname.replace(/^\//, "");
if (configured !== "ebenezer_test") {
  console.error(`Refusing to migrate ${configured}.`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
const current = await client.query("select current_database() as name");
const name = current.rows[0]?.name;
if (name !== "ebenezer_test") {
  console.error(`Refusing connected database ${name}.`);
  await client.end();
  process.exit(1);
}

const sql = readFileSync("drizzle/0032_legal_center.sql", "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map((part) => part.trim())
  .filter(Boolean);
for (const statement of statements) {
  await client.query(statement);
}
console.log(`Applied 0032_legal_center on ${name}.`);
await client.end();
