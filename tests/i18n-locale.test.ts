import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { defaultLocale, parseLocale } from "../src/i18n/config.ts";

const root = join(import.meta.dirname, "..");

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      leafKeys(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

test("parseLocale falls back to English", () => {
  assert.equal(defaultLocale, "en");
  assert.equal(parseLocale(undefined), "en");
  assert.equal(parseLocale("nope"), "en");
  assert.equal(parseLocale("es"), "es");
  assert.equal(parseLocale("te"), "te");
});

test("en, es, and te dictionaries have the same keys", () => {
  const locales = ["en", "es", "te"] as const;
  const sets = locales.map((locale) => {
    const json = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
    return new Set(leafKeys(json));
  });
  for (const keys of sets) {
    assert.equal(keys.size, sets[0].size);
    for (const key of sets[0]) assert.equal(keys.has(key), true, key);
  }
  assert.ok(sets[0].has("signature.joinCommunity"));
  assert.ok(sets[0].has("parish.home.requestHelp"));
});
