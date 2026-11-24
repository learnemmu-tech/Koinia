import { readFileSync } from "node:fs";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (new URL(databaseUrl).pathname.replace(/^\//, "") !== "ebenezer_test") {
  console.error("Refusing non-test database");
  process.exit(1);
}
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
const current = await client.query("select current_database() as name");
if (current.rows[0].name !== "ebenezer_test") process.exit(1);
const sql = readFileSync("drizzle/0034_donation_requests.sql", "utf8");
for (const statement of sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
  await client.query(statement);
}
console.log("Applied 0034 on ebenezer_test");
await client.end();
