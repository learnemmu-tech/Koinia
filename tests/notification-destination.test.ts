import assert from "node:assert/strict";
import { test } from "node:test";

import {
  notificationDestination,
  prayerNotificationPath,
  sanitizeNotificationDestination,
} from "../src/lib/notifications/notification-destination";

test("notification destinations never keep localhost or another origin", () => {
  assert.equal(
    sanitizeNotificationDestination("http://localhost:3000/c/grace/prayer/abc"),
    "/c/grace/prayer/abc"
  );
  assert.equal(
    sanitizeNotificationDestination("https://127.0.0.1:3000/prayer-requests/abc"),
    "/prayer-requests/abc"
  );
  assert.equal(
    sanitizeNotificationDestination("https://evil.example/c/grace/prayer/abc"),
    "/c/grace/prayer/abc"
  );
  assert.equal(sanitizeNotificationDestination("//localhost/prayer-requests/x"), "/prayer-requests/x");
  assert.equal(sanitizeNotificationDestination("https://example.com"), "/");
  assert.equal(sanitizeNotificationDestination("/c/grace/prayer/abc"), "/c/grace/prayer/abc");
  assert.equal(sanitizeNotificationDestination("https://evil.example"), "/");
});

test("Heritage prayer approval notifications use the church-scoped path", () => {
  assert.equal(
    prayerNotificationPath({
      contentId: "11111111-1111-4111-8111-111111111111",
      churchSlug: "grace-church",
      templateId: "heritage",
    }),
    "/c/grace-church/prayer/11111111-1111-4111-8111-111111111111"
  );
  assert.equal(
    prayerNotificationPath({
      contentId: "11111111-1111-4111-8111-111111111111",
      churchSlug: "grace-church",
      templateId: "signature",
    }),
    "/prayer-requests/11111111-1111-4111-8111-111111111111"
  );
});

test("stale localhost approval hrefs become church-scoped relative paths", () => {
  const path = sanitizeNotificationDestination(
    "http://localhost:3000/c/grace-church/prayer/11111111-1111-4111-8111-111111111111"
  );
  assert.equal(
    path,
    "/c/grace-church/prayer/11111111-1111-4111-8111-111111111111"
  );
  assert.equal(/localhost|127\.0\.0\.1/i.test(path), false);
});

test("Heritage membership approval does not send ordinary members to /dashboard", () => {
  assert.equal(
    notificationDestination({
      type: "membership_approved",
      contentId: "church-id",
      churchSlug: "grace-church",
      templateId: "heritage",
    }),
    "/c/grace-church"
  );
  assert.equal(
    notificationDestination({
      type: "membership_approved",
      contentId: "church-id",
      churchSlug: "grace-church",
      templateId: "signature",
    }),
    "/"
  );
});

test("Heritage sermon and event notifications stay on the church site", () => {
  assert.equal(
    notificationDestination({
      type: "sermon",
      contentId: "sermon-1",
      churchSlug: "grace-church",
      templateId: "heritage",
    }),
    "/c/grace-church/sermons/sermon-1"
  );
  assert.equal(
    notificationDestination({
      type: "event",
      contentId: "event-1",
      churchSlug: "grace-church",
      templateId: "signature",
    }),
    "/events/event-1"
  );
});

test("admin prayer-submitted notifications still go to the dashboard review tab", () => {
  assert.equal(
    notificationDestination({
      type: "prayer_request_submitted",
      contentId: "11111111-1111-4111-8111-111111111111",
    }),
    "/dashboard/content?tab=prayers"
  );
});
