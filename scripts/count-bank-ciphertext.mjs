import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const name = new URL(databaseUrl).pathname.replace(/^\//, "");
if (name !== "ebenezer_test") {
  console.error("Refusing database", name);
  process.exit(1);
}
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
const current = await client.query("select current_database() as name");
if (current.rows[0].name !== "ebenezer_test") process.exit(1);
const count = await client.query(
  "select count(*)::int as n from church_donation_methods where account_number_ciphertext is not null"
);
console.log("ciphertext_rows", count.rows[0].n);
await client.end();
