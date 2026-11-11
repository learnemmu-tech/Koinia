import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}
load(".env", false);
load(".env.local", true);

const database = decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.replace(/^\//, ""));
if (database !== "ebenezer_test") {
  console.error(`Refusing integration test. Database is ${database}.`);
  process.exit(1);
}

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.AWS_S3_BUCKET;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
await client.connect();
const church = await client.query(
  "select id, organization_id from churches where organization_id is not null limit 1"
);
if (!church.rows[0]) {
  console.error("No church in ebenezer_test.");
  process.exit(1);
}
const churchId = church.rows[0].id;
const organizationId = church.rows[0].organization_id;
const objectKey = `churches/${churchId}/objects/${randomUUID()}.png`;
const results = [];
let objectId = null;

function allowPublic(row) {
  if (!row) return true;
  return row.status === "ready" && row.visibility === "public_read" && row.published === true;
}

try {
  const inserted = await client.query(
    `insert into stored_objects
      (organization_id, church_id, object_key, original_filename, mime_type, extension, size_bytes, visibility, status, purpose, published)
     values ($1,$2,$3,'pixel.png','image/png','png',$4,'public_read','pending','image', false)
     returning id`,
    [organizationId, churchId, objectKey, png.length]
  );
  objectId = inserted.rows[0].id;
  results.push("inserted-pending");

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: "image/png" }),
    { expiresIn: 300 }
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: png,
  });
  if (!put.ok) throw new Error(`presigned PUT failed ${put.status}`);
  results.push("presigned-put");

  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (Number(head.ContentLength) !== png.length) throw new Error("size mismatch");
  if (!png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error("signature mismatch");
  }
  const checksum = createHash("sha256").update(png).digest("hex");
  await client.query(
    `update stored_objects set status = 'ready', published = true, ready_at = now(), sha256 = $2 where id = $1 and status = 'pending'`,
    [objectId, checksum]
  );
  results.push("verified-ready");

  const ready = await client.query("select status, visibility, published from stored_objects where id = $1", [objectId]);
  if (!allowPublic(ready.rows[0])) throw new Error("public object was rejected");
  const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  const bytes = Buffer.from(await got.Body.transformToByteArray());
  if (bytes.length !== png.length) throw new Error("public read size mismatch");
  results.push("public-read");

  await client.query(
    `update stored_objects set visibility = 'private', published = false where id = $1 and status = 'ready'`,
    [objectId]
  );
  const hidden = await client.query("select status, visibility, published from stored_objects where id = $1", [objectId]);
  if (allowPublic(hidden.rows[0])) throw new Error("private object was publicly allowed");
  results.push("private-rejected");

  const pendingBlocked = allowPublic({ status: "pending", visibility: "public_read", published: false });
  if (pendingBlocked) throw new Error("pending object was publicly allowed");
  results.push("unpublished-rejected");

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  await client.query("delete from stored_objects where id = $1 and status = 'ready'", [objectId]);
  let missing = false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch (error) {
    missing = error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404;
  }
  if (!missing) throw new Error("object still exists after delete");
  results.push("deleted");
  console.log(JSON.stringify({ database, executed: results }));
} catch (error) {
  console.error(JSON.stringify({ database, executed: results, failed: error instanceof Error ? error.message : "failed" }));
  process.exitCode = 1;
} finally {
  if (objectId) {
    await client.query("delete from stored_objects where id = $1", [objectId]).catch(() => undefined);
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })).catch(() => undefined);
  }
  await client.end();
}
