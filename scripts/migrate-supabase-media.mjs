import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const require = createRequire(new URL("../package.json", import.meta.url));
const pg = require("pg");

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

function objectKeyFromSupabaseUrl(value) {
  try {
    const parsed = new URL(value);
    const marker = "/storage/v1/object/public/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    const after = parsed.pathname.slice(index + marker.length);
    const slash = after.indexOf("/");
    if (slash === -1) return null;
    const key = decodeURIComponent(after.slice(slash + 1));
    if (!key || key.includes("..") || key.startsWith("/")) return null;
    return key;
  } catch {
    return null;
  }
}

function mediaPath(objectKey) {
  return `/api/storage/file/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

const databaseName = decodeURIComponent(
  new URL(process.env.DATABASE_URL).pathname.replace(/^\//, "")
);
if (databaseName !== "ebenezer_test") {
  console.error(`Refusing to migrate media. Database is ${databaseName}.`);
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.AWS_S3_BUCKET;
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
await client.connect();

const columns = await client.query(`
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
    and data_type in ('text', 'character varying')
    and table_name not like 'drizzle%'
  order by table_name, column_name
`);

const targets = [];
for (const column of columns.rows) {
  const table = column.table_name;
  const name = column.column_name;
  if (!/^[a-z0-9_]+$/i.test(table) || !/^[a-z0-9_]+$/i.test(name)) continue;
  const found = await client.query(
    `select ctid::text as row_id, "${name}" as value from "${table}" where "${name}" like '%supabase.co/storage/%'`
  );
  for (const row of found.rows) {
    targets.push({ table, column: name, rowId: row.row_id, value: row.value });
  }
}

let copied = 0;
let skipped = 0;
const failures = [];
for (const target of targets) {
  const key = objectKeyFromSupabaseUrl(target.value);
  if (!key) {
    skipped += 1;
    failures.push({ table: target.table, column: target.column, reason: "unparsed-url" });
    continue;
  }
  try {
    const response = await fetch(target.value);
    if (!response.ok) throw new Error(`download ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (Number(head.ContentLength) !== body.length) {
      throw new Error("size mismatch after upload");
    }
    await client.query(`update "${target.table}" set "${target.column}" = $1 where ctid::text = $2`, [
      mediaPath(key),
      target.rowId,
    ]);
    copied += 1;
  } catch (error) {
    skipped += 1;
    failures.push({
      table: target.table,
      column: target.column,
      reason: error instanceof Error ? error.message : "failed",
    });
  }
}

console.log(JSON.stringify({ database: databaseName, found: targets.length, copied, skipped, failures }, null, 2));
await client.end();
