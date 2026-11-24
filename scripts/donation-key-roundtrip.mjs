import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const secret = process.env.DONATION_FIELD_KEY?.trim() ?? "";
if (secret.length < 16) {
  console.error("local key unavailable");
  process.exit(1);
}

const { encryptDonationField } = await import("../src/lib/donations/receiving-validation.ts");
const payload = encryptDonationField("123456789012");
const dir = mkdtempSync(join(tmpdir(), "koinia-key-"));
const file = join(dir, "payload.txt");
writeFileSync(file, payload);

const child = spawnSync(
  process.execPath,
  ["--env-file=.env.local", "--experimental-strip-types", "scripts/donation-key-readback.mjs", file],
  { encoding: "utf8" }
);
rmSync(dir, { recursive: true, force: true });
if (child.status !== 0) {
  console.error("readback failed");
  process.exit(1);
}
console.log("restart-readback ok");
