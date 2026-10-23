import assert from "node:assert/strict";
import { test } from "node:test";

import { callbackNamesChurch, choosePostAuthCallback, joinIntentSlugFromPath, joinPathForSlug } from "../src/lib/auth/auth-paths";
import { roleMeetsMinimum } from "../src/types/membership";

test("a church URL callback is not replaced by another church's join cookie", () => {
  assert.equal(callbackNamesChurch("/c/gethsemane-church"), true);
  assert.equal(callbackNamesChurch("/c/church-of-the-holy/sermons"), true);
  assert.equal(callbackNamesChurch("/join/gethsemane-church"), true);
});

test("a generic post-auth callback does not name a church", () => {
  assert.equal(callbackNamesChurch("/"), false);
  assert.equal(callbackNamesChurch("/auth/continue"), false);
  assert.equal(callbackNamesChurch(""), false);
});

test("stale Holy join cookie does not replace a Gethsemane church URL", () => {
  assert.equal(
    choosePostAuthCallback(
      "/c/gethsemane-church",
      joinPathForSlug("church-of-the-holy"),
      false
    ),
    "/c/gethsemane-church"
  );
});

test("stale Gethsemane join cookie does not replace a Holy church URL", () => {
  assert.equal(
    choosePostAuthCallback(
      "/c/church-of-the-holy",
      joinPathForSlug("gethsemane-church"),
      false
    ),
    "/c/church-of-the-holy"
  );
});

test("visiting a church URL replaces the stored join slug", () => {
  assert.equal(
    joinIntentSlugFromPath("/c/gethsemane-church"),
    "gethsemane-church"
  );
  assert.equal(
    joinIntentSlugFromPath("/c/church-of-the-holy/sermons"),
    "church-of-the-holy"
  );
});

test("a generic callback can still use a fresh join intent", () => {
  assert.equal(
    choosePostAuthCallback("/", joinPathForSlug("gethsemane-church"), false),
    "/join/gethsemane-church"
  );
  assert.equal(
    choosePostAuthCallback("/auth/continue", joinPathForSlug("church-of-the-holy"), false),
    "/join/church-of-the-holy"
  );
});

test("only church administrators of the target organization qualify for join alerts", () => {
  assert.equal(roleMeetsMinimum("church_admin", "church_admin"), true);
  assert.equal(roleMeetsMinimum("org_admin", "church_admin"), true);
  assert.equal(roleMeetsMinimum("member", "church_admin"), false);
  assert.equal(roleMeetsMinimum("volunteer", "church_admin"), false);
});
