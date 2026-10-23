import assert from "node:assert/strict";
import { test } from "node:test";

import { usesSignatureAppExperience } from "../src/lib/templates/church-renderer";
import { signInPathPreservingChurch } from "../src/lib/templates/paths";

test("signature organizations use the existing application renderer", () => {
  assert.equal(usesSignatureAppExperience("signature"), true);
});

test("heritage organizations stay on the heritage public website", () => {
  assert.equal(usesSignatureAppExperience("heritage"), false);
});

test("an unimplemented template does not take the heritage website", () => {
  assert.equal(usesSignatureAppExperience("sanctuary"), true);
});

test("church sign-in keeps the church URL as the callback", () => {
  assert.equal(
    signInPathPreservingChurch("/c/gethsemane-church"),
    "/signin?callbackUrl=%2Fc%2Fgethsemane-church"
  );
  assert.equal(
    signInPathPreservingChurch("/c/gethsemane-church/sermons"),
    "/signin?callbackUrl=%2Fc%2Fgethsemane-church%2Fsermons"
  );
});

test("app sign-in outside a church URL stays on /signin", () => {
  assert.equal(signInPathPreservingChurch("/sermons"), "/signin");
  assert.equal(signInPathPreservingChurch("/"), "/signin");
});
