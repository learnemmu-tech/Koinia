import assert from "node:assert/strict";
import { test } from "node:test";

import type { FirestoreUser } from "../src/lib/firebase-auth-service";
import {
  MEMBER_HOME_PATH,
  memberExperiencePath,
  resolveMembershipRouting,
  resolvePrimaryBranchMembership,
} from "../src/lib/auth/membership-routing";
import { WAITING_APPROVAL_PATH } from "../src/lib/auth/auth-paths";
import { WORKSPACE_BASE } from "../src/lib/dashboard-routes";
import type { FirebaseBranchMembership } from "../src/types/branch-membership";
import type { FirebaseMembership } from "../src/types/membership";

function memberProfile(
  overrides: Partial<FirestoreUser> = {}
): FirestoreUser {
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

function branch(
  overrides: Partial<FirebaseBranchMembership> = {}
): FirebaseBranchMembership {
  return {
    id: "membership-1",
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

function orgMembership(
  overrides: Partial<FirebaseMembership> = {}
): FirebaseMembership {
  return {
    id: "org-membership-1",
    organizationId: "org-1",
    userId: "user-1",
    role: "member",
    status: "active",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

test("memberExperiencePath sends Heritage members to the church site", () => {
  assert.equal(
    memberExperiencePath({
      slug: "church-of-the-holy",
      activeTemplate: "heritage",
    }),
    "/c/church-of-the-holy"
  );
});

test("memberExperiencePath keeps Signature members on the app home", () => {
  assert.equal(
    memberExperiencePath({
      slug: "signature-church",
      activeTemplate: "signature",
    }),
    MEMBER_HOME_PATH
  );
});

test("memberExperiencePath does not invent a church path without a slug", () => {
  assert.equal(
    memberExperiencePath({ slug: "", activeTemplate: "heritage" }),
    MEMBER_HOME_PATH
  );
});

test("approved Heritage member routing does not use the generic homepage", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile(),
    membership: orgMembership(),
    branchMemberships: [branch()],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "church-of-the-holy",
    activeTemplate: "heritage",
  });
  assert.equal(result.status, "active");
  assert.equal(result.destination, "/c/church-of-the-holy");
  assert.notEqual(result.destination, MEMBER_HOME_PATH);
});

test("approved Signature member routing keeps the existing app home", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile(),
    membership: orgMembership(),
    branchMemberships: [branch()],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "grace-chapel",
    activeTemplate: "signature",
  });
  assert.equal(result.status, "active");
  assert.equal(result.destination, MEMBER_HOME_PATH);
});

test("pending members still wait for approval", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile({
      pendingBranchId: "church-1",
      activeBranchId: undefined,
    }),
    membership: orgMembership({ status: "pending" }),
    branchMemberships: [branch({ status: "pending" })],
    churchesCount: 1,
    churchSlug: "church-of-the-holy",
    activeTemplate: "heritage",
  });
  assert.equal(result.status, "pending");
  assert.equal(result.destination, WAITING_APPROVAL_PATH);
});

test("church admins still land on the workspace dashboard", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile({ role: "admin" }),
    membership: orgMembership({ role: "church_admin" }),
    branchMemberships: [branch({ role: "church_admin" })],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "church-of-the-holy",
    activeTemplate: "heritage",
  });
  assert.equal(result.status, "active");
  assert.equal(result.destination, WORKSPACE_BASE);
});

test("an existing member signing in from their church URL returns there", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile({ needsChurchOnboarding: false }),
    membership: orgMembership(),
    branchMemberships: [branch()],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "other-church",
    activeTemplate: "signature",
    memberChurchSlugs: ["gethsemane-church", "other-church"],
    callbackUrl: "/c/gethsemane-church",
  });
  assert.equal(result.destination, "/c/gethsemane-church");
});

test("a visitor who is not a member of the church URL is sent to join", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile({ needsChurchOnboarding: false }),
    membership: orgMembership(),
    branchMemberships: [branch()],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "other-church",
    activeTemplate: "signature",
    memberChurchSlugs: ["other-church"],
    callbackUrl: "/c/gethsemane-church",
  });
  assert.equal(result.destination, "/join/gethsemane-church");
});

test("a member of Church of the Holy who opens Gethsemane is sent to join Gethsemane", () => {
  const result = resolveMembershipRouting({
    profile: memberProfile({
      needsChurchOnboarding: false,
      churchId: "holy",
      activeBranchId: "holy",
      organizationId: "org-holy",
    }),
    membership: orgMembership({ organizationId: "org-holy" }),
    branchMemberships: [
      branch({
        churchId: "holy",
        branchId: "holy",
        organizationId: "org-holy",
      }),
    ],
    churchesCount: 1,
    websiteSetupCompleted: true,
    churchSlug: "church-of-the-holy",
    activeTemplate: "heritage",
    memberChurchSlugs: ["church-of-the-holy"],
    callbackUrl: "/c/gethsemane-church",
  });
  assert.equal(result.destination, "/join/gethsemane-church");
});

test("primary membership selection prefers the active church", () => {
  const selected = resolvePrimaryBranchMembership(memberProfile({
    churchId: "church-b",
    activeBranchId: "church-b",
  }), [
    branch({ churchId: "church-a", branchId: "church-a", id: "m-a" }),
    branch({ churchId: "church-b", branchId: "church-b", id: "m-b" }),
  ]);
  assert.equal(selected?.churchId, "church-b");
});
