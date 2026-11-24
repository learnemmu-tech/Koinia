import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  choicesForAction,
  consentFromSearchParams,
  newConsent,
  parseStoredConsent,
} from "../src/lib/cookies/consent.ts";

test("optional categories start off and accept all enables only configured ones", () => {
  const rejected = choicesForAction("reject_optional");
  assert.equal(rejected.analytics, false);
  assert.equal(rejected.preferences, false);
  assert.equal(rejected.externalMedia, false);
  assert.equal(rejected.necessary, true);
  const custom = choicesForAction("save_preferences", { analytics: true });
  assert.equal(custom.analytics, true);
  assert.equal(custom.preferences, false);
  const all = choicesForAction("accept_all");
  assert.equal(all.analytics, true);
  assert.equal(all.externalMedia, true);
});

test("a stale or forged consent value is ignored", () => {
  assert.equal(parseStoredConsent("not-json"), null);
  assert.equal(
    parseStoredConsent(JSON.stringify({ id: "abc", version: "old", choices: { analytics: true } })),
    null
  );
  assert.equal(consentFromSearchParams(new URLSearchParams("accepted=true")), null);
});

test("a saved decision round-trips and keeps necessary on", () => {
  const consent = newConsent({
    id: "11111111-1111-1111-1111-111111111111",
    action: "save_preferences",
    custom: { preferences: true },
    now: "2026-11-22T00:00:00.000Z",
  });
  const parsed = parseStoredConsent(JSON.stringify(consent));
  assert.equal(parsed?.choices.preferences, true);
  assert.equal(parsed?.choices.analytics, false);
  assert.equal(parsed?.choices.necessary, true);
});

test("analytics scripts are not mounted from the root layout", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.equal(layout.includes("@vercel/analytics"), false);
  assert.equal(layout.includes("us.umami.is"), false);
  assert.equal(layout.includes("CookieConsent"), true);
  const gate = readFileSync("src/components/cookies/cookie-consent.tsx", "utf8");
  assert.ok(gate.includes("analyticsAllowed ? <Analytics />"));
});
