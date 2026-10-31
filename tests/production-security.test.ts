import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { mayLikeContent } from "../src/lib/security/like-access.ts";
import {
  evaluateRedirectTarget,
  evaluateRemoteFetchUrl,
} from "../src/lib/security/remote-fetch-policy.ts";
import { webhookDeliveryAction } from "../src/lib/security/webhook-delivery.ts";

const root = join(import.meta.dirname, "..");

test("remote fetch policy rejects SSRF targets and allows the site host", () => {
  const allowed = ["faithconnecthub.com"];
  const denied = [
    "http://127.0.0.1/image.png",
    "https://127.0.0.1/image.png",
    "https://localhost/image.png",
    "https://10.1.2.3/image.png",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/image.png",
    "file:///etc/passwd",
    "https://evil.example/image.png",
  ];
  for (const url of denied) {
    assert.equal(evaluateRemoteFetchUrl(url, allowed).ok, false, url);
  }
  assert.equal(
    evaluateRemoteFetchUrl("https://faithconnecthub.com/og.png", allowed).ok,
    true
  );
  const current = new URL("https://faithconnecthub.com/og.png");
  assert.equal(
    evaluateRedirectTarget(current, "https://169.254.169.254/", allowed).ok,
    false
  );
  assert.equal(
    evaluateRedirectTarget(current, "http://faithconnecthub.com/og.png", allowed).ok,
    false
  );
});

test("paid entitlement requires an open period end", () => {
  const source = readFileSync(
    join(root, "src", "lib", "subscription", "trial.ts"),
    "utf8"
  );
  assert.match(source, /if \(subscription\.currentPeriodEnd == null\) return false;/);
  assert.match(source, /if \(subscription\.currentPeriodEnd <= now\) return false;/);
  assert.doesNotMatch(source, /currentPeriodEnd == null \|\|/);
});

test("webhook delivery stays retryable until processed", () => {
  assert.equal(webhookDeliveryAction(true, null), "process");
  assert.equal(webhookDeliveryAction(false, null), "process");
  assert.equal(webhookDeliveryAction(false, new Date()), "already_processed");
});

test("likes follow content visibility", () => {
  assert.equal(
    mayLikeContent(
      { exists: true, published: true, membersOnly: false },
      { hasChurchAccess: false, canManageChurch: false }
    ),
    true
  );
  assert.equal(
    mayLikeContent(
      { exists: true, published: false, membersOnly: false },
      { hasChurchAccess: true, canManageChurch: false }
    ),
    false
  );
  assert.equal(
    mayLikeContent(
      { exists: true, published: false, membersOnly: false },
      { hasChurchAccess: false, canManageChurch: true }
    ),
    true
  );
  assert.equal(
    mayLikeContent(
      { exists: true, published: true, membersOnly: true },
      { hasChurchAccess: false, canManageChurch: false }
    ),
    false
  );
  assert.equal(
    mayLikeContent(
      { exists: false, published: true, membersOnly: false },
      { hasChurchAccess: true, canManageChurch: true }
    ),
    false
  );
});

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (entry === "route.ts") files.push(path);
  }
  return files;
}

test("mutating API routes declare an auth boundary", () => {
  const markers = [
    "verifyBearerToken",
    "requireApiUser",
    "requireBillingAdmin",
    "requirePlatformSuperAdmin",
    "CRON_SECRET",
    "verifyRazorpayWebhookSignature",
    "PUBLIC_MUTATION",
  ];
  const missing: string[] = [];
  for (const file of walk(join(root, "src", "app", "api"))) {
    const source = readFileSync(file, "utf8");
    if (!/export async function (POST|PUT|PATCH|DELETE)/.test(source)) continue;
    if (!markers.some((marker) => source.includes(marker))) {
      missing.push(file.replace(root, ""));
    }
  }
  assert.deepEqual(missing, []);
});

test("open graph route does not fetch a caller-supplied image", () => {
  const source = readFileSync(join(root, "src", "app", "api", "og", "route.tsx"), "utf8");
  assert.equal(source.includes('searchParams.get("image")'), false);
  assert.match(source, /redirect: "manual"/);
  assert.match(source, /evaluateRemoteFetchUrl/);
});

test("subscription activation fails closed", () => {
  const source = readFileSync(
    join(root, "src", "lib", "subscription", "razorpay-subscription-server.ts"),
    "utf8"
  );
  assert.match(source, /isBillableRazorpaySubscription/);
  assert.doesNotMatch(source, /status: "authenticated"/);
  const verify = readFileSync(
    join(root, "src", "app", "api", "subscription", "razorpay", "verify", "route.ts"),
    "utf8"
  );
  assert.match(verify, /verifyRazorpaySubscriptionSignature/);
  assert.match(verify, /requireBillingAdmin/);
});

test("invitation email is bound to the stored recipient", () => {
  const source = readFileSync(
    join(root, "src", "app", "api", "email", "invitation", "route.ts"),
    "utf8"
  );
  assert.match(source, /invitation\.email/);
  assert.match(source, /recipient cannot be changed/);
});
