import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  canMarkPrayerAnswered,
  canModeratePrayerRequest,
  canPrayForRequest,
  canReadPrayerRequest,
  isSameAuthenticatedUser,
  type PrayerPolicyRequest,
  type PrayerPolicyViewer,
} from "../src/lib/prayer/prayer-policy";

const A = "church-a";
const publicReq: PrayerPolicyRequest = { userId: "author", churchId: A, status: "approved", shareWithCommunity: true };
const privateReq: PrayerPolicyRequest = { userId: "author", churchId: A, status: "approved", shareWithCommunity: false };
const pendingReq: PrayerPolicyRequest = { userId: "author", churchId: A, status: "pending", shareWithCommunity: true };

const anon: PrayerPolicyViewer = { clerkId: null, hasChurchAccess: false, canManageChurch: false };
const member: PrayerPolicyViewer = { clerkId: "member", hasChurchAccess: true, canManageChurch: false };
const otherChurch: PrayerPolicyViewer = { clerkId: "outsider", hasChurchAccess: false, canManageChurch: false };
const admin: PrayerPolicyViewer = { clerkId: "admin", hasChurchAccess: true, canManageChurch: true };
const author: PrayerPolicyViewer = { clerkId: "author", hasChurchAccess: true, canManageChurch: false };

test("anonymous users cannot read any prayer request", () => {
  for (const request of [publicReq, privateReq, pendingReq]) {
    assert.equal(canReadPrayerRequest(request, anon), false);
  }
});

test("members of another church (or non-members) cannot read a request, public or private", () => {
  for (const request of [publicReq, privateReq, pendingReq]) {
    assert.equal(canReadPrayerRequest(request, otherChurch), false);
  }
  // Also requests without a church fail closed.
  assert.equal(canReadPrayerRequest({ ...publicReq, churchId: null }, member), false);
});

test("church members read public requests only; private and pending stay hidden", () => {
  assert.equal(canReadPrayerRequest(publicReq, member), true);
  assert.equal(canReadPrayerRequest(privateReq, member), false);
  assert.equal(canReadPrayerRequest(pendingReq, member), false);
});

test("authors read their own request; admins read every request of their church", () => {
  assert.equal(canReadPrayerRequest(privateReq, author), true);
  assert.equal(canReadPrayerRequest(pendingReq, author), true);
  assert.equal(canReadPrayerRequest(privateReq, admin), true);
  assert.equal(canReadPrayerRequest(pendingReq, admin), true);
});

test("conversation/prayer actions require church access to a public request", () => {
  assert.equal(canPrayForRequest(publicReq, member), true);
  assert.equal(canPrayForRequest(publicReq, otherChurch), false);
  assert.equal(canPrayForRequest(publicReq, anon), false);
  assert.equal(canPrayForRequest(privateReq, member), false);
});

test("only church admins moderate; only authors or admins mark answered", () => {
  assert.equal(canModeratePrayerRequest(admin), true);
  assert.equal(canModeratePrayerRequest(member), false);
  assert.equal(canModeratePrayerRequest(anon), false);
  assert.equal(canMarkPrayerAnswered(publicReq, author), true);
  assert.equal(canMarkPrayerAnswered(publicReq, member), false);
  assert.equal(canMarkPrayerAnswered(publicReq, admin), true);
});

test("a client-supplied user id is only valid when it equals the session user", () => {
  assert.equal(isSameAuthenticatedUser("u1", "u1"), true);
  assert.equal(isSameAuthenticatedUser("u1", "u2"), false);
  assert.equal(isSameAuthenticatedUser(null, "u1"), false);
  assert.equal(isSameAuthenticatedUser(undefined, undefined), false);
});

const src = (file: string) => readFileSync(join(import.meta.dirname, "..", "src", file), "utf8");

test("server-action prayer modules expose no unauthenticated, scope-taking reads", () => {
  const queries = src("lib/firebase-prayer-request-queries.ts");
  assert.match(queries, /^"use server"/);
  assert.doesNotMatch(queries, /export async function (getPrayerRequests|getApprovedPrayerRequests|getLatestApprovedPrayerRequests)\b/);
  assert.match(queries, /loadReadablePrayerRequest/);
});

test("every prayer mutation action checks the server session before writing", () => {
  const mutations = src("lib/prayer-request-mutations.ts");
  const actions = [...mutations.matchAll(/export async function (\w+)\(/g)].map((m) => m[1]);
  assert.ok(actions.length >= 5);
  for (const name of actions) {
    const start = mutations.indexOf(`export async function ${name}(`);
    const next = mutations.indexOf("export async function", start + 10);
    const body = mutations.slice(start, next === -1 ? undefined : next);
    assert.match(
      body,
      /requirePrayerSession|loadPrayerRequestForWrite/,
      `${name} must authenticate on the server`
    );
  }
  assert.doesNotMatch(mutations, /incrementPrayerCount/);
  const approveStart = mutations.indexOf("export async function updatePrayerRequestStatus(");
  const approveNext = mutations.indexOf("export async function", approveStart + 10);
  const approveBody = mutations.slice(
    approveStart,
    approveNext === -1 ? undefined : approveNext
  );
  const revalidateAt = approveBody.indexOf("revalidatePrayerWall");
  const notifyAt = approveBody.indexOf("triggerPrayerApprovedMemberNotifications");
  assert.ok(revalidateAt !== -1, "approval must invalidate the prayer wall cache");
  assert.ok(notifyAt !== -1, "approval must notify after a successful update");
  assert.ok(revalidateAt < notifyAt, "notify only after the wall is revalidated");
});

test("platform and Heritage prayer detail pages share the server-side read gate", () => {
  const platform = src("app/(root)/prayer-requests/[id]/page.tsx");
  const heritage = src("templates/heritage/pages/member-prayer.tsx");
  assert.match(platform, /loadReadablePrayerRequest/);
  assert.match(heritage, /loadReadablePrayerRequest/);
  assert.match(platform, /heritagePrayerDetailPath/);
  assert.match(heritage, /requestBelongsToChurch/);
  assert.doesNotMatch(platform, /firebase-prayer-request-queries/);
  // Metadata must not reveal request titles before authorization.
  assert.doesNotMatch(platform, /request\.title[\s\S]{0,40}description/);
});

test("per-user prayer actions verify the id against the session", () => {
  for (const file of ["lib/prayer-user-actions.ts", "lib/prayer-intercession-actions.ts"]) {
    assert.match(src(file), /isSameAuthenticatedUser/);
  }
});
