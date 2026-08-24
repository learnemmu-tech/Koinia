# SaaS Foundation Verification Checklist

Use this checklist before starting Member Management, Pricing, Attendance, or Stripe work.

## Prerequisites

- [ ] Firebase project configured (`.env` / `.env.local`)
- [ ] `npm run build` passes
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules,firestore:indexes`

---

## 1. New signup → automatic organization

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Sign up as a new church admin | Account created |
| 1.2 | Check Firestore `organizations` | New org document exists |
| 1.3 | Check Firestore `memberships` | Owner membership for user + org |
| 1.4 | Check Firestore `subscriptions/{organizationId}` | Free plan, `organizationId` set |
| 1.5 | Check Firestore `users/{uid}` | `organizationId` set; `needsChurchOnboarding: true` if no church |

**Pass criteria:** User never sees a “create organization” step.

---

## 2. First-church onboarding

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | After signup (org with zero churches) | Redirect to `/onboarding` |
| 2.2 | Submit church form (name, country, timezone, currency, language) | Church created under org |
| 2.3 | After submit | Redirect to admin dashboard |
| 2.4 | Sign in again with church already present | Onboarding skipped |

**Pass criteria:** First church is created automatically; no manual org creation.

---

## 3. Tenant fields on new content

For each content type below, create one item in the admin panel, then inspect the Firestore document:

| Content type | Collection | Required fields |
|--------------|------------|-----------------|
| Song | `songs` | `organizationId`, `churchId`, `branchId` (null if none) |
| Sermon | `sermons` | same |
| Article | `articles` | same |
| Event | `events` | same |
| Prayer request | `prayerRequests` | same |
| Donation campaign | `donationCampaigns` | same |
| Donation | `donations` | same |
| Notification (publish) | `notifications` | same |

**Pass criteria:** Every new document includes all three tenant fields.

---

## 4. Organization-level subscription

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Org with one church | Subscription doc keyed by `organizationId` |
| 4.2 | Add second church to same org | No second subscription doc per church |
| 4.3 | Admin subscription UI / API | Reads plan/limits from org subscription |

**Pass criteria:** One subscription per organization; churches inherit org plan.

---

## 5. Data isolation

| Test | Expected |
|------|----------|
| User A (Org A) cannot read Org B churches/content | Denied by rules or empty scoped queries |
| Church A admin cannot see Church B content (same org, different church) | Queries scoped by `churchId` |
| Branch-scoped content (when branch selected) | `branchId` set; other branches hidden |

---

## 6. Legacy compatibility

| Test | Expected |
|------|----------|
| Church without `organizationId` | App still loads; content queries by `churchId` work |
| Legacy `subscriptions/{churchId}` | API falls back or migrates via `migration-server` helpers |

**Migration helpers (server):** `src/lib/organization/migration-server.ts`

---

## 7. Quick Firestore spot-check query

In Firebase Console, open any newly created document and verify:

```json
{
  "organizationId": "<org-id>",
  "churchId": "<church-id>",
  "branchId": null
}
```

---

## Sign-off

| Area | Verified by | Date | Notes |
|------|-------------|------|-------|
| Signup + org | | | |
| Onboarding | | | |
| Tenant stamping | | | |
| Subscriptions | | | |
| Isolation | | | |
| Legacy | | | |
