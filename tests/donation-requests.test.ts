import assert from "node:assert/strict";
import test from "node:test";

import {
  approvalCreatesCampaign,
  canTransitionDonationRequest,
  isDonationRequestCategory,
  parseRequestedAmount,
} from "../src/lib/donations/request-rules.ts";

test("donation request categories and amounts are validated", () => {
  assert.equal(isDonationRequestCategory("medical_assistance"), true);
  assert.equal(isDonationRequestCategory("tax_deduction"), false);
  assert.equal(parseRequestedAmount("10.5").ok, true);
  assert.equal(parseRequestedAmount("-1").ok, false);
  assert.equal(parseRequestedAmount("0").ok, false);
});

test("approval does not create a campaign and terminal states do not change", () => {
  assert.equal(approvalCreatesCampaign(), false);
  assert.equal(canTransitionDonationRequest("submitted", "approved"), true);
  assert.equal(canTransitionDonationRequest("approved", "rejected"), false);
  assert.equal(canTransitionDonationRequest("rejected", "approved"), false);
});
