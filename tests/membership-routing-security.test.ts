import assert from "node:assert/strict";
import { test } from "node:test";

import type { FirestoreUser } from "../src/lib/firebase-auth-service";
import { resolveMembershipRouting } from "../src/lib/auth/membership-routing";
import { WAITING_APPROVAL_PATH } from "../src/lib/auth/auth-paths";
import { canEnterDashboard } from "../src/lib/auth/workspace-access";
import { sanitizeCallbackUrl } from "../src/lib/callback-url";
import { WORKSPACE_BASE } from "../src/lib/dashboard-routes";
import type { FirebaseBranchMembership } from "../src/types/branch-membership";
import type { FirebaseMembership } from "../src/types/membership";

function profile(overrides: Partial<FirestoreUser> = {}): FirestoreUser {
  return {
    firstName: "Jane",
    lastName: "Member",
    email: "jane@example.com",
    role: "user",
    organizationId: "org-1",
    needsChurchOnboarding: false,
    websiteSetupCompleted: true,
    churchId: "church-1",
    activeBranchId: "church-1",
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function branch(overrides: Partial<FirebaseBranchMembership> = {}): FirebaseBranchMembership {
  return {
    id: "m-1",
    organizationId: "org-1",
    churchId: "church-1",
    branchId: "church-1",
    userId: "user-1",
    role: "member",
    status: "active",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function org(overrides: Partial<FirebaseMembership> = {}): FirebaseMembership {
  return {
    id: "o-1",
    organizationId: "org-1",
    userId: "user-1",
    role: "member",
    status: "active",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

const heritage = { churchSlug: "church-of-the-holy", activeTemplate: "heritage" } as const;

function memberRouting(callbackUrl?: string, extra = {}) {
  return resolveMembershipRouting({
    profile: profile(),
    membership: org(),
    branchMemberships: [branch()],
    churchesCount: 1,
    websiteSetupCompleted: true,
    callbackUrl,
    ...heritage,
    ...extra,
  });
}

test("approved Heritage member never lands on /dashboard, even with a dashboard callback", () => {
  for (const callback of ["/dashboard", "/dashboard/content?tab=songs", "/admin-worship-panel", "/admin"]) {
    const result = memberRouting(callback);
    assert.equal(result.destination, "/c/church-of-the-holy", callback);
  }
  assert.equal(memberRouting().destination, "/c/church-of-the-holy");
});

test("approved Signature member keeps '/' and is not sent to /dashboard", () => {
  const result = memberRouting("/dashboard", { churchSlug: "grace", activeTemplate: "signature" });
  assert.equal(result.destination, "/");
});

test("pending member goes to /waiting-approval regardless of callback", () => {
  const result = resolveMembershipRouting({
    profile: profile({ pendingBranchId: "church-1", activeBranchId: undefined }),
    membership: org({ status: "pending" }),
    branchMemberships: [branch({ status: "pending" })],
    churchesCount: 1,
    callbackUrl: "/dashboard",
    ...heritage,
  });
  assert.equal(result.destination, WAITING_APPROVAL_PATH);
});

test("authorized church admin still reaches /dashboard", () => {
  const result = resolveMembershipRouting({
    profile: profile({ role: "admin" }),
    membership: org({ role: "church_admin" }),
    branchMemberships: [branch({ role: "church_admin" })],
    churchesCount: 1,
    websiteSetupCompleted: true,
    callbackUrl: "/dashboard/content",
    ...heritage,
  });
  assert.equal(result.destination, "/dashboard/content");
  assert.equal(
    resolveMembershipRouting({
      profile: profile({ role: "admin" }),
      membership: org({ role: "church_admin" }),
      branchMemberships: [branch({ role: "church_admin" })],
      churchesCount: 1,
      websiteSetupCompleted: true,
      ...heritage,
    }).destination,
    WORKSPACE_BASE
  );
});

test("an approved member's church feature callback is preserved", () => {
  assert.equal(
    memberRouting("/c/church-of-the-holy/community").destination,
    "/c/church-of-the-holy/community"
  );
});

test("a feature callback for another church goes through that church's join flow", () => {
  assert.equal(
    memberRouting("/c/other-church/community").destination,
    "/join/other-church"
  );
});

test("only administrators may enter the dashboard; ordinary members may not", () => {
  const base = { churchesCount: 1 };
  assert.equal(
    canEnterDashboard({ ...base, profile: profile(), membership: org(), branchMembership: branch() }),
    false
  );
  assert.equal(
    canEnterDashboard({ ...base, profile: profile(), membership: org({ role: "volunteer" }) }),
    false
  );
  assert.equal(
    canEnterDashboard({
      ...base,
      profile: profile(),
      membership: org({ role: "church_admin" }),
      branchMembership: branch({ role: "church_admin" }),
    }),
    true
  );
  assert.equal(canEnterDashboard({ ...base, profile: null }), false);
});

test("callback sanitizing rejects external and ambiguous redirect targets", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2Fevil.example",
    "/%5cevil.example",
    "javascript:alert(1)",
    "/ok\nhttps://evil.example",
    "evil.example",
  ]) {
    assert.equal(sanitizeCallbackUrl(bad, "/fallback"), "/fallback", bad);
  }
  assert.equal(
    sanitizeCallbackUrl("/c/church-of-the-holy/community?tab=groups", "/"),
    "/c/church-of-the-holy/community?tab=groups"
  );
});
