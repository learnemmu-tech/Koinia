import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

function load(path, override) {
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
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}

load(".env", false);
load(".env.local", true);
const name = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, "");
if (name !== "ebenezer_test") throw new Error(`Refusing ${name}`);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const found = await client.query(
  "select id, email from users where email like '%@donation-sec.test'"
);
console.log(`fixtures ${found.rowCount}`);
if (found.rowCount) {
  const ids = found.rows.map((row) => row.id);
  await client.query(
    `delete from donation_verification_events where church_id in (
      select id from churches where organization_id in (
        select organization_id from users where id = any($1::uuid[]) and organization_id is not null
        union
        select id from organizations where owner_id = any($1::uuid[])
      )
    )`,
    [ids]
  );
  await client.query(
    `delete from donations where church_id in (
      select id from churches where organization_id in (select id from organizations where owner_id = any($1::uuid[]))
    )`,
    [ids]
  );
  await client.query(
    `delete from donation_campaigns where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(
    `delete from church_donation_methods where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(
    `delete from church_donation_profiles where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(
    `delete from subscriptions where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(
    `delete from church_memberships where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(
    `delete from organization_memberships where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`,
    [ids]
  );
  await client.query(`delete from churches where organization_id in (select id from organizations where owner_id = any($1::uuid[]))`, [ids]);
  await client.query(`delete from organizations where owner_id = any($1::uuid[])`, [ids]);
  await client.query(`delete from users where id = any($1::uuid[])`, [ids]);
}
const left = await client.query(
  "select count(*)::int as count from users where email like '%@donation-sec.test'"
);
console.log(`remaining ${left.rows[0].count}`);
await client.end();
