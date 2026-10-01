import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  filterHeritagePrayerWallRequests,
  heritagePrayerDetailPath,
  heritagePrayerPath,
  isPrayerRequestVisibleOnChurchWall,
  requestBelongsToChurch,
  resolveHeritagePrayerView,
} from "../src/templates/heritage/prayer";
import { heritageShareModalInset } from "../src/templates/heritage/heritage-share-modal-inset";
import type { FirebasePrayerRequest } from "../src/types/firebase-prayer-request";

const CHURCH_A = "11111111-1111-4111-8111-111111111111";
const CHURCH_B = "22222222-2222-4222-8222-222222222222";

test("prayer paths stay inside the church website", () => {
  assert.equal(heritagePrayerPath("grace-church"), "/c/grace-church/prayer");
  assert.equal(
    heritagePrayerDetailPath("grace-church", "abc/def"),
    "/c/grace-church/prayer/abc%2Fdef"
  );
});

test("wall shows only approved, shared requests from the same church", () => {
  assert.equal(
    isPrayerRequestVisibleOnChurchWall(
      { churchId: CHURCH_A, status: "approved", shareWithCommunity: true },
      CHURCH_A
    ),
    true
  );
  // other church
  assert.equal(
    isPrayerRequestVisibleOnChurchWall(
      { churchId: CHURCH_B, status: "approved", shareWithCommunity: true },
      CHURCH_A
    ),
    false
  );
  // pending / rejected
  for (const status of ["pending", "rejected"]) {
    assert.equal(
      isPrayerRequestVisibleOnChurchWall(
        { churchId: CHURCH_A, status, shareWithCommunity: true },
        CHURCH_A
      ),
      false
    );
  }
  // private
  assert.equal(
    isPrayerRequestVisibleOnChurchWall(
      { churchId: CHURCH_A, status: "approved", shareWithCommunity: false },
      CHURCH_A
    ),
    false
  );
  // missing church data fails closed
  assert.equal(
    isPrayerRequestVisibleOnChurchWall(
      { churchId: null, status: "approved", shareWithCommunity: true },
      CHURCH_A
    ),
    false
  );
  assert.equal(
    isPrayerRequestVisibleOnChurchWall(
      { churchId: CHURCH_A, status: "approved", shareWithCommunity: true },
      ""
    ),
    false
  );
});

test("only signed-in users with church access see the wall", () => {
  assert.equal(
    resolveHeritagePrayerView({ isAuthenticated: true, hasChurchAccess: true }),
    "wall"
  );
  assert.equal(
    resolveHeritagePrayerView({ isAuthenticated: true, hasChurchAccess: false }),
    "public-form"
  );
  assert.equal(
    resolveHeritagePrayerView({ isAuthenticated: false, hasChurchAccess: true }),
    "public-form"
  );
  assert.equal(
    resolveHeritagePrayerView({ isAuthenticated: false, hasChurchAccess: false }),
    "public-form"
  );
});

test("heritage prayer pages never send members to the platform prayer route", () => {
  const root = join(import.meta.dirname, "..", "src", "templates", "heritage");
  for (const file of [
    "pages/contact.tsx",
    "pages/member-prayer.tsx",
    "components/heritage-prayer-form.tsx",
    "components/heritage-prayer-wall.tsx",
    "components/heritage-share-prayer-dialog.tsx",
    "prayer.ts",
  ]) {
    const source = readFileSync(join(root, file), "utf8");
    assert.equal(
      /["'`]\/prayer-requests/.test(source),
      false,
      `${file} must not link to the platform /prayer-requests route`
    );
  }
});

test("church-scoped detail requires the URL church, not wall-only visibility", () => {
  assert.equal(
    requestBelongsToChurch({ churchId: CHURCH_A }, CHURCH_A),
    true
  );
  assert.equal(
    requestBelongsToChurch({ churchId: CHURCH_B }, CHURCH_A),
    false
  );
});

function wallRequest(
  overrides: Partial<FirebasePrayerRequest>
): FirebasePrayerRequest {
  return {
    id: "req-1",
    churchId: CHURCH_A,
    name: "Jordan",
    title: "Pray for healing",
    request: "Please pray for recovery after surgery.",
    category: "health",
    isAnonymous: false,
    shareWithCommunity: true,
    isAnswered: false,
    status: "approved",
    prayerCount: 1,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

test("search and category filters stay on authorized wall requests", () => {
  const requests = [
    wallRequest({ id: "health-1", category: "health", title: "Surgery" }),
    wallRequest({
      id: "family-1",
      category: "family",
      title: "Family peace",
      request: "Pray for our home.",
    }),
    wallRequest({
      id: "other-church",
      churchId: CHURCH_B,
      title: "Surgery",
      category: "health",
    }),
    wallRequest({
      id: "private",
      shareWithCommunity: false,
      title: "Surgery",
    }),
  ];

  const health = filterHeritagePrayerWallRequests(requests, {
    churchId: CHURCH_A,
    search: "",
    category: "health",
  });
  assert.deepEqual(
    health.map((item) => item.id),
    ["health-1"]
  );

  const search = filterHeritagePrayerWallRequests(requests, {
    churchId: CHURCH_A,
    search: "home",
    category: "all",
  });
  assert.deepEqual(
    search.map((item) => item.id),
    ["family-1"]
  );

  const combined = filterHeritagePrayerWallRequests(requests, {
    churchId: CHURCH_A,
    search: "surgery",
    category: "health",
  });
  assert.deepEqual(
    combined.map((item) => item.id),
    ["health-1"]
  );

  const none = filterHeritagePrayerWallRequests(requests, {
    churchId: CHURCH_A,
    search: "no-such-text",
    category: "all",
  });
  assert.equal(none.length, 0);
});

test("Heritage member wall uses a share modal instead of a permanent form", () => {
  const page = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "pages", "member-prayer.tsx"),
    "utf8"
  );
  assert.match(page, /HeritageSharePrayerDialog/);
  assert.doesNotMatch(page, /HeritagePrayerForm/);
  assert.match(page, /HeritagePrayerWall/);
  assert.match(
    readFileSync(
      join(
        import.meta.dirname,
        "..",
        "src",
        "lib",
        "prayer-request-mutations.ts"
      ),
      "utf8"
    ),
    /revalidatePrayerWall/
  );
});

test("share modal inset stays inside the viewport and below a tall header", () => {
  const inset = heritageShareModalInset({
    headerBottom: 80,
    viewportHeight: 900,
  });
  assert.equal(inset.top, 92);
  assert.equal(inset.maxHeight, 796);
  assert.ok(inset.top + inset.maxHeight <= 900);

  const short = heritageShareModalInset({
    headerBottom: 80,
    viewportHeight: 200,
  });
  assert.equal(short.top, 12);
  assert.equal(short.maxHeight, 176);
  assert.ok(short.top + short.maxHeight <= 200);

  const mobile = heritageShareModalInset({
    headerBottom: 72,
    viewportHeight: 667,
    safeBottom: 34,
  });
  assert.ok(mobile.top >= 72);
  assert.ok(mobile.top + mobile.maxHeight + 34 <= 667);
});

test("Heritage share dialog stacks above the page and uses Heritage type tokens", () => {
  const dialog = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "components",
      "heritage-share-prayer-dialog.tsx"
    ),
    "utf8"
  );
  const form = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "components",
      "heritage-prayer-form.tsx"
    ),
    "utf8"
  );
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  assert.match(dialog, /heritage-dialog-overlay/);
  assert.match(dialog, /heritage-dialog-panel/);
  assert.match(dialog, /heritageDisplay\.variable/);
  assert.match(dialog, /heritageSans\.variable/);
  assert.match(css, /z-index:\s*400/);
  assert.match(css, /z-index:\s*401/);
  assert.match(form, /heritage-dialog-label/);
  assert.match(form, /heritage-dialog-footer/);
  assert.match(form, /heritage-dialog-body/);
  assert.doesNotMatch(form, /heritage-dialog-switch/);
  assert.match(dialog, /Share a Request/);
  assert.doesNotMatch(dialog, /Request Prayer/);
  assert.doesNotMatch(
    dialog,
    /heritage-eyebrow/,
    "modal heading must not use the uppercase eyebrow style"
  );
});
