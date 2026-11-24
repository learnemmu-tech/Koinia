import { readFileSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.includes("DONATION_FIELD_KEY") && !line.trim().startsWith("#"));
  console.log(file, "assignments", lines.length);
  for (const line of lines) {
    const raw = line.slice(line.indexOf("=") + 1).trim();
    const quoted = raw.startsWith('"') || raw.startsWith("'");
    const value = quoted ? raw.slice(1, -1) : raw;
    console.log("quoted", quoted, "length", value.length, "whitespaceOnly", value.trim().length === 0);
  }
}
