/**
 * Development-only reset: wipes local /public/uploads test files.
 * Does NOT reset PostgreSQL, drop tables, or delete migrations.
 *
 * Usage:
 *   node scripts/dev-reset.mjs --confirm
 */

import { existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join, resolve } from "path";

const uploadsDir = resolve(process.cwd(), "public", "uploads");

function wipeLocalUploads() {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    return 0;
  }

  let removed = 0;
  for (const entry of readdirSync(uploadsDir)) {
    rmSync(join(uploadsDir, entry), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

const confirmed = process.argv.includes("--confirm");
if (!confirmed) {
  console.error("Refusing to run without --confirm");
  process.exit(1);
}

const removed = wipeLocalUploads();
console.log(`Removed ${removed} local upload entries. PostgreSQL was not modified.`);
