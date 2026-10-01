import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", file), "utf8");

const WEBSITE_MIGRATIONS = [
  "0019_church_websites",
  "0020_website_setup_completed",
  "0021_website_about",
  "0022_website_about_sections",
];

test("website migrations 0019-0022 are journaled and additive", () => {
  const journal = JSON.parse(root("drizzle/meta/_journal.json")) as {
    entries: { tag: string }[];
  };
  const tags = journal.entries.map((entry) => entry.tag);
  for (const tag of WEBSITE_MIGRATIONS) {
    assert.ok(tags.includes(tag), `${tag} missing from drizzle journal`);
    const sql = root(`drizzle/${tag}.sql`);
    assert.doesNotMatch(sql, /\bDROP TABLE\b/i);
    assert.doesNotMatch(sql, /\bDROP COLUMN\b/i);
    assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
  }
});

test("0020 only backfills null website_setup_completed_at from created_at", () => {
  const sql = root("drizzle/0020_website_setup_completed.sql");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "website_setup_completed_at"/);
  assert.match(
    sql,
    /SET "website_setup_completed_at" = "created_at"\s+WHERE "website_setup_completed_at" IS NULL/
  );
});
