import { readFileSync } from "node:fs";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const configured = new URL(databaseUrl).pathname.replace(/^\//, "");
if (configured !== "ebenezer_test") {
  console.error(`Refusing ${configured}`);
  process.exit(1);
}
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
const current = await client.query("select current_database() as name");
if (current.rows[0].name !== "ebenezer_test") {
  console.error(`Refusing ${current.rows[0].name}`);
  process.exit(1);
}
const sql = readFileSync("drizzle/0033_cookie_consent.sql", "utf8");
for (const statement of sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) {
  await client.query(statement);
}
console.log("Applied 0033 on ebenezer_test");
await client.end();
