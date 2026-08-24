import fs from "fs";
import path from "path";

const root = "d:/repo/FaithConnectHub/src";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const logCall =
  /^\s*console\.log\([\s\S]*?\);\s*\n/gm;

let changed = 0;
for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;
  let prev;
  do {
    prev = next;
    next = next.replace(logCall, "");
  } while (next !== prev);

  if (next !== original) {
    fs.writeFileSync(file, next);
    changed += 1;
    console.log("Cleaned:", file);
  }
}

console.log(`Removed console.log from ${changed} files`);
