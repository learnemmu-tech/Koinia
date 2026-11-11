import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyTemporaryTrialContentAllowance,
  TEMPORARY_TRIAL_CONTENT_ALLOWANCE,
} from "../src/lib/subscription/trial-allowance.ts";
import { getPlanLimits, isAtLimit } from "../src/lib/subscription/limits.ts";
import { getPlan } from "../src/lib/subscription/plans.ts";

test("free trial uses the plan catalog, not a temporary donation allowance", () => {
  const free = getPlan("free");
  const applied = applyTemporaryTrialContentAllowance(
    "trial",
    getPlanLimits("free"),
    free.features
  );
  assert.equal(applied.limits.members, 15);
  assert.equal(applied.limits.churches, 1);
  assert.equal(applied.limits.songs, 5);
  assert.equal(applied.limits.sermons, 5);
  assert.equal(applied.limits.articles, 5);
  assert.equal(applied.limits.shorts, 3);
  assert.equal(applied.limits.events, 1);
  assert.equal(applied.limits.donationCampaigns, 0);
  assert.equal(applied.limits.books, 3);
  assert.equal(applied.limits.prayerRequests, 5);
  assert.equal(applied.features.canCreateDonations, false);
  assert.equal(applied.limits.events, free.limits.events);
  assert.notEqual(applied.limits.events, TEMPORARY_TRIAL_CONTENT_ALLOWANCE.events);
  assert.equal(isAtLimit(0, applied.limits.donationCampaigns), true);
  assert.equal(isAtLimit(5, applied.limits.songs), true);
  assert.equal(isAtLimit(4, applied.limits.songs), false);
  assert.equal(isAtLimit(5, applied.limits.sermons), true);
  assert.equal(isAtLimit(5, applied.limits.articles), true);
  assert.equal(isAtLimit(3, applied.limits.shorts), true);
  assert.equal(isAtLimit(2, applied.limits.shorts), false);
  assert.equal(isAtLimit(3, applied.limits.books), true);
  assert.equal(isAtLimit(5, applied.limits.prayerRequests), true);
  assert.equal(isAtLimit(1, applied.limits.events), true);
  assert.equal(isAtLimit(15, applied.limits.members), true);

  const starter = getPlan("starter");
  const starterTrial = applyTemporaryTrialContentAllowance(
    "trial",
    starter.limits,
    starter.features
  );
  assert.equal(
    starterTrial.limits.donationCampaigns,
    starter.limits.donationCampaigns
  );
  assert.equal(starterTrial.features.canCreateDonations, true);
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
