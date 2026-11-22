import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import pg from "pg";

import { normalizeDatabaseUrl } from "../src/db/normalize-database-url.ts";

function loadEnv(path: string, override: boolean) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(".env", false);
loadEnv(".env.local", true);
process.env.DONATION_FIELD_KEY = "test-donation-field-key";

const databaseUrl = process.env.DATABASE_URL ?? "";
const databaseName = new URL(databaseUrl || "postgres:///missing").pathname.replace(/^\//, "");

test("donation security fixtures stay inside ebenezer_test", async (t) => {
  assert.equal(databaseName, "ebenezer_test");
  const client = new pg.Client({ connectionString: normalizeDatabaseUrl(databaseUrl) });
  await client.connect();
  const connected = await client.query("select current_database() as name");
  assert.equal(connected.rows[0].name, "ebenezer_test");

  const { DonationAccessError, getChurchDonationSettings, publicCampaignMethods, recordOfflineDonation, reviewChurchDonation, saveChurchQrImage, saveChurchReceivingMethod, submitChurchDonation } =
    await import("../src/lib/donations/church-receiving.ts");
  const { userCanReviewChurchMemberships } = await import("../src/lib/postgres/session.ts");
  const { encryptDonationField } = await import("../src/lib/donations/receiving-validation.ts");

  const stamp = `${Date.now()}`;
  const ids: string[] = [];
  async function user(email: string) {
    const row = await client.query(
      `insert into users (email, clerk_id, first_name, last_name)
       values ($1, $2, 'Sec', 'Test') returning id, clerk_id, email`,
      [email, `donation_sec_${email}`]
    );
    ids.push(row.rows[0].id);
    return row.rows[0] as { id: string; clerk_id: string; email: string };
  }

  const owner = await user(`owner-${stamp}@donation-sec.test`);
  const delegated = await user(`admin-${stamp}@donation-sec.test`);
  const member = await user(`member-${stamp}@donation-sec.test`);
  const editor = await user(`editor-${stamp}@donation-sec.test`);
  const outsider = await user(`outsider-${stamp}@donation-sec.test`);
  const churchAdminA = await user(`church-admin-${stamp}@donation-sec.test`);
  const org = await client.query(
    `insert into organizations (name, owner_id) values ($1, $2) returning id`,
    [`Donation sec ${stamp}`, owner.id]
  );
  const orgId = org.rows[0].id as string;
  async function church(slug: string) {
    const row = await client.query(
      `insert into churches (organization_id, name, slug, join_slug)
       values ($1, $2, $3, $3) returning id`,
      [orgId, slug, slug]
    );
    return row.rows[0].id as string;
  }
  const churchA = await church(`sec-a-${stamp}`);
  const churchB = await church(`sec-b-${stamp}`);
  await client.query(
    `insert into subscriptions (organization_id, plan_id, status, current_period_end)
     values ($1, 'starter', 'active', now() + interval '2 days')`,
    [orgId]
  );
  await client.query(
    `insert into organization_memberships (organization_id, user_id, role, status)
     values ($1, $2, 'owner', 'active')`,
    [orgId, owner.id]
  );
  async function churchRole(userId: string, churchId: string, role: string) {
    await client.query(
      `insert into church_memberships (organization_id, church_id, user_id, role, status)
       values ($1, $2, $3, $4, 'active')`,
      [orgId, churchId, userId, role]
    );
  }
  await churchRole(delegated.id, churchA, "church_admin");
  await churchRole(member.id, churchA, "member");
  await churchRole(editor.id, churchA, "editor");
  await churchRole(churchAdminA.id, churchA, "church_admin");
  await churchRole(outsider.id, churchB, "church_admin");
  const campaign = await client.query(
    `insert into donation_campaigns (organization_id, church_id, title, currency, status)
     values ($1, $2, 'Security campaign', 'INR', 'active') returning id`,
    [orgId, churchA]
  );
  const campaignId = campaign.rows[0].id as string;
  await client.query(
    `insert into church_donation_profiles (church_id, organization_id, authorized_declaration)
     values ($1, $2, true)`,
    [churchA, orgId]
  );
  await client.query(
    `insert into church_donation_methods
      (church_id, organization_id, method, enabled, display_name, upi_id, ownership_status)
     values ($1, $2, 'upi_id', true, 'Church UPI', 'church.sec@okhdfcbank', 'declared')`,
    [churchA, orgId]
  );

  const results: Record<string, string> = {};
  async function denied(clerkId: string) {
    const settled = await Promise.allSettled([
      recordOfflineDonation({
        clerkId,
        churchId: churchA,
        campaignId,
        amount: 50,
        donatedOn: "2026-01-20",
        donorName: "Denied",
      }),
      reviewChurchDonation({
        clerkId,
        churchId: churchA,
        donationId: "00000000-0000-4000-8000-000000000000",
        decision: "rejected",
        reason: "not allowed",
      }),
    ]);
    return settled.every(
      (item) => item.status === "rejected" && item.reason instanceof DonationAccessError
    );
  }

  try {
    await recordOfflineDonation({
      clerkId: owner.clerk_id,
      churchId: churchA,
      campaignId,
      amount: 100,
      donatedOn: "2026-01-15",
      donorName: "Owner gift",
    });
    results["1-main-admin"] = "PASS";
  } catch (error) {
    results["1-main-admin"] = `FAIL ${error instanceof Error ? error.message : "unknown"}`;
  }

  try {
    await recordOfflineDonation({
      clerkId: delegated.clerk_id,
      churchId: churchA,
      campaignId,
      amount: 125,
      donatedOn: "2026-01-16",
      donorName: "Delegated gift",
    });
    results["2-delegated-admin"] = "PASS";
  } catch (error) {
    results["2-delegated-admin"] = `FAIL ${error instanceof Error ? error.message : "unknown"}`;
  }

  results["3-member"] = (await denied(member.clerk_id)) ? "PASS" : "FAIL member was not denied";
  results["4-editor"] = (await denied(editor.clerk_id)) ? "PASS" : "FAIL editor was not denied";

  await client.query(
    `update church_memberships set role = 'member' where user_id = $1 and church_id = $2`,
    [delegated.id, churchA]
  );
  const stillAllowed = await userCanReviewChurchMemberships(
    delegated.clerk_id,
    delegated.email,
    churchA
  );
  results["5-removed-admin"] = stillAllowed ? "FAIL role change was still authorized" : "PASS";

  try {
    await getChurchDonationSettings(churchAdminA.clerk_id, churchB);
    results["6-cross-church"] = "FAIL owner read church B settings";
  } catch (error) {
    results["6-cross-church"] = error instanceof DonationAccessError ? "PASS" : "FAIL unexpected error";
  }

  const pending = await submitChurchDonation({
    campaignId,
    method: "upi_id",
    donorName: "Donor",
    donorEmail: `donor-${stamp}@donation-sec.test`,
    amount: 250,
    isAnonymous: false,
    paymentReference: "UPIREF250",
    idempotencyKey: `sec-pending-${stamp}`,
  });
  const before = await client.query(
    `select current_amount from donation_campaigns where id = $1`,
    [campaignId]
  );
  const reviews = await Promise.allSettled([
    reviewChurchDonation({
      clerkId: owner.clerk_id,
      churchId: churchA,
      donationId: pending.id,
      decision: "verified",
    }),
    reviewChurchDonation({
      clerkId: owner.clerk_id,
      churchId: churchA,
      donationId: pending.id,
      decision: "verified",
    }),
  ]);
  const after = await client.query(
    `select current_amount from donation_campaigns where id = $1`,
    [campaignId]
  );
  const fulfilled = reviews.filter((item) => item.status === "fulfilled").length;
  const delta = Number(after.rows[0].current_amount) - Number(before.rows[0].current_amount);
  results["7-concurrent-verify"] =
    fulfilled === 1 && delta === 250 ? "PASS" : `FAIL fulfilled=${fulfilled} delta=${delta}`;

  const offlineKey = `sec-offline-${stamp}`;
  const firstOffline = await recordOfflineDonation({
    clerkId: owner.clerk_id,
    churchId: churchA,
    campaignId,
    amount: 80,
    donatedOn: "2026-02-01",
    donorName: "Repeat cash",
    idempotencyKey: offlineKey,
  });
  const secondOffline = await recordOfflineDonation({
    clerkId: owner.clerk_id,
    churchId: churchA,
    campaignId,
    amount: 80,
    donatedOn: "2026-02-01",
    donorName: "Repeat cash",
    idempotencyKey: offlineKey,
  });
  results["8-offline-repeat"] =
    firstOffline.id === secondOffline.id ? "PASS" : "FAIL duplicate offline records";

  let mismatchRejected = false;
  try {
    await submitChurchDonation({
      campaignId,
      method: "upi_id",
      donorName: "Other",
      donorEmail: `other-${stamp}@donation-sec.test`,
      amount: 999,
      isAnonymous: false,
      paymentReference: "UPIREF999",
      idempotencyKey: `sec-pending-${stamp}`,
    });
  } catch {
    mismatchRejected = true;
  }
  results["9-idempotency-mismatch"] = mismatchRejected ? "PASS" : "FAIL reused a different gift";

  await client.query(
    `insert into church_donation_methods
      (church_id, organization_id, method, enabled, display_name, account_holder_name, bank_name,
       account_number_ciphertext, account_number_last4, ifsc_code, ownership_status)
     values ($1, $2, 'bank_transfer', true, 'Church bank', 'Church A', 'Example Bank', $3, '9012', 'HDFC0001234', 'declared')`,
    [churchA, orgId, encryptDonationField("123456789012")]
  );
  const publicMethods = JSON.stringify(await publicCampaignMethods(campaignId));
  results["10-public-privacy"] =
    publicMethods.includes("123456789012") || publicMethods.includes("accountNumberCiphertext")
      ? "FAIL sensitive bank data was public"
      : "PASS";

  let uploadDenied = false;
  try {
    await saveChurchQrImage({
      clerkId: member.clerk_id,
      churchId: churchA,
      fileName: "qr.png",
      mimeType: "image/png",
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]),
      confirmDetails: true,
      confirmMismatch: false,
    });
  } catch (error) {
    uploadDenied = error instanceof DonationAccessError;
  }
  let crossReadDenied = false;
  try {
    await getChurchDonationSettings(outsider.clerk_id, churchA);
  } catch (error) {
    crossReadDenied = error instanceof DonationAccessError;
  }
  results["11-private-objects"] =
    uploadDenied && crossReadDenied ? "PASS" : `FAIL upload=${uploadDenied} cross=${crossReadDenied}`;

  delete process.env.DONATION_FIELD_KEY;
  let storedPlain = false;
  try {
    await saveChurchReceivingMethod({
      clerkId: owner.clerk_id,
      churchId: churchA,
      method: "bank_transfer",
      enabled: true,
      displayName: "Church bank",
      accountHolderName: "Church A",
      bankName: "Example Bank",
      accountNumber: "999988887777",
      ifscCode: "HDFC0001234",
    });
  } catch {
    const stored = await client.query(
      `select account_number_ciphertext from church_donation_methods
       where church_id = $1 and method = 'bank_transfer'`,
      [churchA]
    );
    storedPlain = JSON.stringify(stored.rows).includes("999988887777");
  }
  results["12-missing-key"] = storedPlain ? "FAIL plaintext stored" : "PASS";

  console.log(JSON.stringify(results, null, 2));
  t.after(async () => {
    await client.query(`delete from donation_verification_events where church_id = $1`, [churchA]);
    await client.query(`delete from donations where church_id = $1 or church_id = $2`, [churchA, churchB]);
    await client.query(`delete from donation_campaigns where organization_id = $1`, [orgId]);
    await client.query(`delete from church_donation_methods where organization_id = $1`, [orgId]);
    await client.query(`delete from church_donation_profiles where organization_id = $1`, [orgId]);
    await client.query(`delete from subscriptions where organization_id = $1`, [orgId]);
    await client.query(`delete from church_memberships where organization_id = $1`, [orgId]);
    await client.query(`delete from organization_memberships where organization_id = $1`, [orgId]);
    await client.query(`delete from churches where organization_id = $1`, [orgId]);
    await client.query(`delete from organizations where id = $1`, [orgId]);
    for (const id of ids) await client.query(`delete from users where id = $1`, [id]);
    await client.end();
  });

  const failed = Object.entries(results).filter(([, value]) => !value.startsWith("PASS"));
  assert.deepEqual(failed, []);
});
