import assert from "node:assert/strict";
import { test } from "node:test";

import {
  decryptDonationField,
  encryptDonationField,
} from "../src/lib/donations/receiving-validation.ts";

const sample = "123456789012";

test("missing and short donation keys fail before storage", () => {
  const previous = process.env.DONATION_FIELD_KEY;
  delete process.env.DONATION_FIELD_KEY;
  assert.throws(() => encryptDonationField(sample), /not configured/);
  process.env.DONATION_FIELD_KEY = "short-key";
  assert.throws(() => encryptDonationField(sample), /invalid/);
  if (previous === undefined) delete process.env.DONATION_FIELD_KEY;
  else process.env.DONATION_FIELD_KEY = previous;
});

test("a valid key round-trips and does not store the account number", () => {
  process.env.DONATION_FIELD_KEY = "test-donation-field-key";
  const payload = encryptDonationField(sample);
  assert.equal(payload.includes(sample), false);
  assert.equal(decryptDonationField(payload), sample);
  const again = encryptDonationField(sample);
  assert.notEqual(again, payload);
  assert.equal(decryptDonationField(again), sample);
});
