import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const file = ".env.local";
const text = readFileSync(file, "utf8");
const exists = text.split(/\r?\n/).some((line) => line.startsWith("DONATION_FIELD_KEY=") && !line.trim().startsWith("#"));
if (exists) {
  console.log("preserved");
  process.exit(0);
}
const value = randomBytes(32).toString("base64");
const suffix = text.endsWith("\n") || text.length === 0 ? "" : "\n";
writeFileSync(file, `${text}${suffix}DONATION_FIELD_KEY=${value}\n`);
console.log("written", value.length);
