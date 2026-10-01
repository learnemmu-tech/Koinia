import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const src = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", "src", file), "utf8");

function exportedFunctionBody(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}(`);
  assert.ok(start !== -1, `missing export ${name}`);
  const next = source.indexOf("export async function", start + 10);
  return source.slice(start, next === -1 ? undefined : next);
}

test("church mutation server actions authenticate from the session", () => {
  const mutations = src("lib/church-mutations.ts");
  for (const name of ["createChurch", "updateChurch", "setChurchActive", "deleteChurch"]) {
    const body = exportedFunctionBody(mutations, name);
    assert.match(body, /requireChurchMutationSession/, `${name} must read the server session`);
  }
  assert.match(exportedFunctionBody(mutations, "createChurch"), /userCanManageOrganization/);
  assert.match(exportedFunctionBody(mutations, "updateChurch"), /assertCanManageChurch/);
  assert.match(exportedFunctionBody(mutations, "setChurchActive"), /assertCanManageChurch/);
  assert.match(exportedFunctionBody(mutations, "deleteChurch"), /userCanManageOrganization/);
  assert.doesNotMatch(mutations, /input\.userId|clientUserId/);
});

test("favorite writes and reads bind to the Clerk session, not a client userId", () => {
  const mutations = src("lib/favorite-mutations.ts");
  assert.match(exportedFunctionBody(mutations, "addFavorite"), /requireFavoriteSession/);
  assert.match(exportedFunctionBody(mutations, "removeFavorite"), /requireFavoriteSession/);
  assert.doesNotMatch(mutations, /export async function addFavorite\(\s*userId/);
  const queries = src("lib/favorite-queries.ts");
  assert.match(queries, /await auth\(\)/);
  assert.doesNotMatch(queries, /export async function fetchUserFavorites\(\s*userId/);
  const context = src("context/favorites-context.tsx");
  assert.doesNotMatch(context, /addFavorite\(user\.uid/);
  assert.doesNotMatch(context, /removeFavorite\(user\.uid/);
});

test("Razorpay client verify is rate-limited and refuses non-pending donations", () => {
  const route = src("app/api/donations/verify-razorpay/route.ts");
  assert.match(route, /rateLimitDonationCheckout/);
  assert.match(route, /status: 429/);
  assert.match(route, /paymentStatus === "completed"/);
  assert.match(route, /paymentStatus !== "pending"/);
  assert.match(route, /verifyRazorpaySignature/);
});

test("payment provider prefers Razorpay when PAYMENT_PROVIDER is unset", () => {
  const payments = src("lib/payments/index.ts");
  assert.match(payments, /"razorpay"\) as PaymentProviderId/);
  assert.doesNotMatch(
    payments,
    /PAYMENT_PROVIDER\?\.trim\(\)\.toLowerCase\(\) \|\|\s*"stripe"/
  );
});
