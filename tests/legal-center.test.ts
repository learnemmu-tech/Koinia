import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH, MEMBER_LEGAL_NAV } from "../src/legal/paths.ts";
import { legalHref, legalReturnLabel, safeLegalReturnTo } from "../src/legal/return-to.ts";
import {
  acceptanceIdempotencyKey,
  canPublish,
  isHistoricallyReadableStatus,
  isPublicLegalStatus,
  requiresReacceptance,
  selectCurrentPublished,
} from "../src/legal/publication.ts";

test("canonical legal paths are relative and do not include a host", () => {
  assert.equal(LEGAL_TERMS_PATH, "/legal/terms");
  assert.equal(LEGAL_PRIVACY_PATH, "/legal/privacy");
  assert.equal(LEGAL_TERMS_PATH.includes("localhost"), false);
});

test("authored legal documents are not approved or published", () => {
  const text = [
    readFileSync("src/legal/documents.ts", "utf8"),
    readFileSync("src/legal/documents-more.ts", "utf8"),
  ].join("\n");
  assert.equal(text.includes("FaithConnectHub"), false);
  assert.equal(text.includes('reviewStatus: "published"'), false);
  assert.equal(text.includes('reviewStatus: "approved"'), false);
  assert.ok(text.includes("pending_legal_review"));
  assert.ok((text.match(/slug: "/g) ?? []).length >= 12);
});

test("only a published status is public", () => {
  assert.equal(isPublicLegalStatus("published"), true);
  assert.equal(isPublicLegalStatus("draft"), false);
  assert.equal(isPublicLegalStatus("pending_legal_review"), false);
  assert.equal(isPublicLegalStatus("approved"), false);
  assert.equal(isHistoricallyReadableStatus("archived"), true);
  assert.equal(isHistoricallyReadableStatus("draft"), false);
  assert.equal(
    selectCurrentPublished([
      { reviewStatus: "archived" },
      { reviewStatus: "published" },
    ])?.reviewStatus,
    "published"
  );
});

test("acceptance retries share one idempotency key", () => {
  const first = acceptanceIdempotencyKey({
    userId: "user",
    versionId: "version",
    action: "accept_terms",
  });
  const second = acceptanceIdempotencyKey({
    userId: "user",
    versionId: "version",
    action: "accept_terms",
  });
  assert.equal(first, second);
});

test("material changes require a new acceptance and typos do not", () => {
  assert.equal(
    requiresReacceptance({
      materialChange: true,
      priorVersionId: "a",
      nextVersionId: "b",
    }),
    true
  );
  assert.equal(
    requiresReacceptance({
      materialChange: false,
      priorVersionId: "a",
      nextVersionId: "b",
    }),
    false
  );
});

test("publishing requires a super admin, confirmation, and an approver name", () => {
  assert.equal(
    canPublish({ actorIsSuperAdmin: false, confirmation: "PUBLISH", approverName: "A Person" }).ok,
    false
  );
  assert.equal(
    canPublish({ actorIsSuperAdmin: true, confirmation: "yes", approverName: "A Person" }).ok,
    false
  );
  assert.equal(
    canPublish({ actorIsSuperAdmin: true, confirmation: "PUBLISH", approverName: "A Person" }).ok,
    true
  );
});

test("public legal pages render each document instead of a shared pending notice", () => {
  const page = readFileSync("src/app/legal/[slug]/page.tsx", "utf8");
  assert.equal(page.includes("not shown as"), false);
  assert.equal(page.includes("resolveReadableDocument"), true);
  const terms = readFileSync("src/legal/documents.ts", "utf8");
  const more = readFileSync("src/legal/documents-more.ts", "utf8");
  assert.ok(terms.includes('slug: "terms"'));
  assert.ok(terms.includes('slug: "privacy"'));
  assert.ok(more.includes('slug: "donations"'));
  assert.ok(more.includes('slug: "subscriptions"'));
});

test("return paths stay internal and name the originating screen", () => {
  assert.equal(safeLegalReturnTo("https://evil.example"), null);
  assert.equal(safeLegalReturnTo("//evil.example"), null);
  assert.equal(legalReturnLabel("/c/grace/login"), "Back to Sign In");
  assert.equal(legalReturnLabel("/signup"), "Back to Create Account");
  assert.equal(legalHref("/legal/terms", "/c/grace/login"), "/legal/terms?returnTo=%2Fc%2Fgrace%2Flogin");
  assert.equal(MEMBER_LEGAL_NAV.some((item) => item.slug === "subscriptions"), false);
});

test("authentication templates link to the canonical legal routes", () => {
  const files = [
    "src/templates/heritage/pages/login.tsx",
    "src/templates/heritage/pages/signup.tsx",
    "src/templates/parish/pages/auth.tsx",
    "src/app/(firebase-auth)/layout.tsx",
    "src/lib/templates/nav.ts",
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.equal(source.includes('href="/terms"'), false, file);
    assert.equal(source.includes('href="/privacy"'), false, file);
    assert.equal(source.includes("localhost"), false, file);
  }
});
