import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyTemporaryTrialContentAllowance,
  TEMPORARY_TRIAL_CONTENT_ALLOWANCE,
} from "../src/lib/subscription/trial-allowance";
import { getPlanLimits } from "../src/lib/subscription/limits";
import { getPlan } from "../src/lib/subscription/plans";

test("temporary trial allowance is 3 events, 3 donations, and 3 books", () => {
  const free = getPlan("free");
  const applied = applyTemporaryTrialContentAllowance(
    "trial",
    getPlanLimits("free"),
    free.features
  );
  assert.equal(applied.limits.events, TEMPORARY_TRIAL_CONTENT_ALLOWANCE.events);
  assert.equal(
    applied.limits.donationCampaigns,
    TEMPORARY_TRIAL_CONTENT_ALLOWANCE.donationCampaigns
  );
  assert.equal(applied.limits.books, TEMPORARY_TRIAL_CONTENT_ALLOWANCE.books);
  assert.equal(applied.features.canCreateDonations, true);
  assert.equal(applied.features.canCreateEvents, true);
});

test("temporary trial allowance does not change paid or expired snapshots", () => {
  const professional = getPlan("professional");
  const paid = applyTemporaryTrialContentAllowance(
    "paid",
    professional.limits,
    professional.features
  );
  assert.equal(paid.limits.events, professional.limits.events);
  const expired = applyTemporaryTrialContentAllowance(
    "expired",
    getPlanLimits("free"),
    getPlan("free").features
  );
  assert.equal(expired.limits.events, getPlanLimits("free").events);
  assert.equal(expired.features.canCreateDonations, false);
});
