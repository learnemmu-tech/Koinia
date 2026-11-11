import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  validateChurchAddress,
  validateChurchPhone,
} from "../src/lib/organization/onboarding-contact.ts";
import {
  chargeConfirmsPaidAccess,
  deferredSubscriptionStart,
  periodEndFromPlan,
  receiptNumberForPayment,
} from "../src/lib/subscription/billing-eligibility.ts";
import { renderReceiptPdf } from "../src/lib/subscription/receipt-pdf.ts";
import { getTrialEndDate, isTrialNotStarted, notStartedTrialLifecycle, TRIAL_DURATION_DAYS } from "../src/lib/subscription/trial.ts";
import { isTrialAccessExpired } from "../src/lib/subscription/trial-write.ts";

const root = process.cwd();

test("active Razorpay subscription with a future period grants access", () => {
  const end = new Date(Date.now() + 86_400_000);
  assert.equal(
    chargeConfirmsPaidAccess({
      status: "active",
      currentEnd: end,
      hasPaidCharge: false,
    }),
    true
  );
});

test("captured charge grants access while Razorpay is still authenticating", () => {
  const end = new Date(Date.now() + 86_400_000);
  assert.equal(
    chargeConfirmsPaidAccess({
      status: "authenticated",
      currentEnd: end,
      hasPaidCharge: true,
    }),
    true
  );
  assert.equal(
    chargeConfirmsPaidAccess({
      status: "authenticated",
      currentEnd: end,
      hasPaidCharge: false,
    }),
    false
  );
});

test("failed, cancelled, and expired provider states do not grant access", () => {
  const end = new Date(Date.now() + 86_400_000);
  for (const status of ["failed", "cancelled", "expired", "completed"]) {
    assert.equal(
      chargeConfirmsPaidAccess({
        status,
        currentEnd: end,
        hasPaidCharge: true,
      }),
      false
    );
  }
});

test("a paid charge does not grant access after the period ends", () => {
  assert.equal(
    chargeConfirmsPaidAccess({
      status: "active",
      currentEnd: new Date(Date.now() - 1000),
      hasPaidCharge: true,
    }),
    false
  );
});

test("renewal period follows the Razorpay plan interval", () => {
  const start = new Date("2026-01-15T00:00:00.000Z");
  assert.equal(
    periodEndFromPlan(start, "monthly", 1).toISOString(),
    "2026-02-15T00:00:00.000Z"
  );
  assert.equal(
    periodEndFromPlan(start, "yearly", 1).toISOString(),
    "2027-01-15T00:00:00.000Z"
  );
});

test("card plan changes wait until the current period ends", () => {
  const now = Date.parse("2026-11-04T00:00:00.000Z");
  const periodEnd = new Date("2026-12-02T18:30:00.000Z");
  assert.equal(deferredSubscriptionStart(periodEnd, now), Math.floor(periodEnd.getTime() / 1000));
  assert.equal(
    deferredSubscriptionStart(new Date(now + 5 * 60 * 1000), now),
    "too_soon"
  );
  assert.equal(deferredSubscriptionStart(new Date(now - 1000), now), null);
});

test("receipt numbers are stable for the same payment", () => {
  const paidAt = new Date("2026-11-03T00:00:00.000Z");
  const first = receiptNumberForPayment("pay_Abcd1234WXYZ", paidAt);
  const second = receiptNumberForPayment("pay_Abcd1234WXYZ", paidAt);
  assert.equal(first, second);
  assert.match(first, /^FCH-R-2026-/);
});

test("receipt pdf is a downloadable document without tax claims", () => {
  const pdf = Buffer.from(
    renderReceiptPdf({
      id: "receipt-1",
      organizationId: "org-1",
      receiptNumber: "FCH-R-2026-TEST",
      description: "Starter subscription",
      amountMinor: 2900,
      currency: "INR",
      status: "paid",
      paidAt: "2026-11-03T00:00:00.000Z",
      planId: "starter",
      periodStart: "2026-11-03T00:00:00.000Z",
      periodEnd: "2026-12-03T00:00:00.000Z",
      customerName: "Grace Church",
      customerEmail: null,
      paymentMethodSummary: "Card ending 1111",
      providerPaymentId: "pay_test",
      providerInvoiceId: "inv_test",
      providerSubscriptionId: "sub_test",
      documentStatus: "ready",
    })
  );
  assert.match(pdf.subarray(0, 8).toString(), /%PDF-1.4/);
  assert.match(pdf.toString(), /Not a Tax Invoice/);
  assert.match(pdf.toString(), /Rs\. 29\.00/);
  assert.match(pdf.toString(), /pay_test/);
});

test("billing routes authorize the organization and subscription reads reconcile", () => {
  const list = readFileSync(
    join(root, "src", "app", "api", "subscription", "invoices", "route.ts"),
    "utf8"
  );
  const download = readFileSync(
    join(
      root,
      "src",
      "app",
      "api",
      "subscription",
      "invoices",
      "[receiptId]",
      "route.ts"
    ),
    "utf8"
  );
  const snapshot = readFileSync(
    join(root, "src", "lib", "subscription", "subscription-server.ts"),
    "utf8"
  );
  const query = readFileSync(
    join(root, "src", "hooks", "use-subscription-query.ts"),
    "utf8"
  );
  assert.match(list, /syncOrganizationReceipts/);
  assert.match(list, /requireBillingAdmin/);
  assert.match(download, /requireBillingAdmin/);
  assert.match(download, /getBillingReceiptForOrganization/);
  assert.match(snapshot, /reconcileOrganizationBilling/);
  assert.match(query, /refetchOnMount: "always"/);
  const history = readFileSync(
    join(root, "src", "components", "subscription", "billing-history.tsx"),
    "utf8"
  );
  const openAt = history.indexOf("async function openReceipt");
  const openBody = history.slice(openAt, openAt + 700);
  assert.ok(openBody.indexOf("window.open") < openBody.indexOf("authorizedFetch"));
  assert.equal(history.includes("Billing details"), false);
});

test("onboarding offers only currently purchasable plans", () => {
  const plans = readFileSync(
    join(root, "src", "lib", "subscription", "plans.ts"),
    "utf8"
  );
  assert.match(plans, /export function getPurchasablePlans/);
  assert.match(plans, /!plan\.comingSoon/);
  assert.match(plans, /!plan\.contactSales/);
  const enterprise = plans.slice(plans.indexOf("enterprise:"));
  assert.match(enterprise, /comingSoon: true/);
});

test("church phone and address validation", () => {
  assert.equal(validateChurchPhone(""), "Church phone number is required");
  assert.equal(validateChurchPhone("+91 98765 43210"), null);
  assert.equal(validateChurchPhone("9876543210"), null);
  assert.notEqual(validateChurchPhone("123"), null);
  assert.equal(validateChurchAddress("12 Main Street"), null);
  assert.equal(validateChurchAddress("Main"), "Enter a complete church address");
});

test("trial end is 14 days after confirmation time", () => {
  const start = new Date("2026-11-06T12:00:00.000Z");
  const end = getTrialEndDate(start);
  assert.equal(end.getTime() - start.getTime(), TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
});

test("a subscription with no trial is not treated as expired", () => {
  assert.equal(
    isTrialNotStarted({ status: "incomplete", trialStart: null, trialEnd: null }),
    true
  );
  const lifecycle = notStartedTrialLifecycle();
  assert.equal(isTrialAccessExpired(lifecycle), false);
  assert.equal(
    isTrialAccessExpired({ access: "expired", phase: "expired" }),
    true
  );
});

test("new workspaces do not start a trial until plan confirmation", () => {
  const provision = readFileSync(
    join(root, "src", "lib", "postgres", "provision-workspace.ts"),
    "utf8"
  );
  assert.match(provision, /status: "incomplete"/);
  assert.equal(provision.includes("getTrialEndDate"), false);
  const legacy = readFileSync(
    join(root, "src", "lib", "subscription", "subscription-server.ts"),
    "utf8"
  );
  assert.match(legacy, /s.status <> 'incomplete'/);
});
