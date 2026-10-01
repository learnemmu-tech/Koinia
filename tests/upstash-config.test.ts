import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", file), "utf8");
const src = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", "src", file), "utf8");

test("Upstash Redis vars are documented and optional in the env schema", () => {
  const env = src("lib/env.ts");
  assert.match(env, /UPSTASH_REDIS_REST_URL: z\.string\(\)\.url\(\)\.optional\(\)/);
  assert.match(env, /UPSTASH_REDIS_REST_TOKEN: z\.string\(\)\.min\(1\)\.optional\(\)/);
  const example = root(".env.example");
  assert.match(example, /UPSTASH_REDIS_REST_URL=/);
  assert.match(example, /UPSTASH_REDIS_REST_TOKEN=/);
});

test("production rate limiting fails closed without Upstash and does not fail open", () => {
  const rateLimit = src("lib/rate-limit.ts");
  assert.match(rateLimit, /UPSTASH_REDIS_REST_URL/);
  assert.match(rateLimit, /UPSTASH_REDIS_REST_TOKEN/);
  assert.match(rateLimit, /production && \(!upstashUrl \|\| !upstashToken\)/);
  assert.match(rateLimit, /return \{ allowed: false, retryAfterMs: 60_000 \}/);
  assert.doesNotMatch(rateLimit, /fail open|allowed: true.*production/i);
});
