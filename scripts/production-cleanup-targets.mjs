/**
 * One-time, production-targeted cleanup for three explicitly audited accounts.
 *
 * Default behavior is a READ ONLY audit. Writes require both:
 *   --execute
 *   --confirm=DELETE_AUDITED_PRODUCTION_TEST_ACCOUNTS
 *
 * This script never calls Clerk, storage, billing, or email provider APIs.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import pg from "pg";

const TARGET_EMAILS = [
  "futureblock07@gmail.com",
  "futureblockdev@gmail.com",
  "learnemmu@gmail.com",
];

const IDS = {
  faithConnectHubOrganization: "fc0f40a5-e3e7-489c-896a-261f58d89c93",
  graceOrganization: "1f67220b-1218-4437-96c8-5d5ef6f75e3b",
  graceChurch: "edceedde-b687-4fd3-abe7-e73cac3aa0d8",
  graceSuccessor: "36cd190e-c672-4643-8fec-516809d5fab6",
  futureBlock07: "fb76a0b7-23b6-4b4c-bb9a-02021e27eda8",
  futureBlockDev: "3195a6b7-57f2-4755-a197-29e90700f9a4",
  learnEmmu: "768275ea-2241-4845-ac7a-a1503bf954d7",
};

const EXPECTED = {
  users: 3,
  notificationReads: 26,
  notifications: 53,
  favorites: 1,
  recentlyViewed: 17,
  prayerIntercessions: 1,
  prayerResponses: 2,
  videoShortLikes: 3,
  videoShortComments: 6,
  communityMessages: 1,
  churchMemberships: 2,
  organizationMemberships: 2,
  videoShortsToReassign: 13,
  faithSubscriptions: 1,
  faithTrialEvents: 2,
  faithOrganizations: 1,
  graceNonTargetMembers: 6,
  graceNonTargetActiveContexts: 5,
  nonTargetLikesOnReassignedShorts: 1,
  migrationRows: 21,
};

const CONFIRMATION = "DELETE_AUDITED_PRODUCTION_TEST_ACCOUNTS";
const EXPECTED_DATABASE = "neondb";
const EXPECTED_HOST = "ep-purple-surf-a5hmk2nt.us-east-2.aws.neon.tech";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requiredArg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, found ${actual}`);
  }
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function deleteExactly(client, label, sql, params, expected) {
  const result = await client.query(sql, params);
  assertEqual(label, result.rowCount ?? 0, expected);
  return result.rowCount ?? 0;
}

async function schemaFingerprint(client) {
  const result = await client.query(`
    SELECT jsonb_build_object(
      'tables', (SELECT count(*) FROM information_schema.tables
                 WHERE table_schema IN ('public', 'drizzle')),
      'columns', (SELECT count(*) FROM information_schema.columns
                  WHERE table_schema IN ('public', 'drizzle')),
      'constraints', (SELECT count(*) FROM information_schema.table_constraints
                      WHERE table_schema IN ('public', 'drizzle')),
      'indexes', (SELECT count(*) FROM pg_indexes
                  WHERE schemaname IN ('public', 'drizzle'))
    ) AS fingerprint
  `);
  return result.rows[0].fingerprint;
}

async function foreignKeysReferencing(client, referencedTable) {
  const result = await client.query(
    `SELECT DISTINCT tc.table_name, kcu.column_name, rc.delete_rule
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
     JOIN information_schema.referential_constraints rc
       ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.constraint_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
       AND ccu.table_name = $1
       AND ccu.column_name = 'id'
     ORDER BY tc.table_name, kcu.column_name`,
    [referencedTable]
  );
  return result.rows;
}

async function assertFaithConnectHubIsolation(client, targetIds) {
  const expectedReferences = new Map([
    ["notifications.organization_id", 2],
    ["organization_memberships.organization_id", 1],
    ["subscriptions.organization_id", 1],
    ["trial_lifecycle_events.organization_id", 2],
    ["users.organization_id", 1],
  ]);
  const discoveredReferences = new Set();
  for (const reference of await foreignKeysReferencing(client, "organizations")) {
    const key = `${reference.table_name}.${reference.column_name}`;
    discoveredReferences.add(key);
    const count = await scalar(
      client,
      `SELECT count(*) FROM "${reference.table_name}"
       WHERE "${reference.column_name}" = $1`,
      [IDS.faithConnectHubOrganization]
    );
    assertEqual(`FaithConnectHub reference ${key}`, count, expectedReferences.get(key) ?? 0);
  }
  for (const key of expectedReferences.keys()) {
    if (!discoveredReferences.has(key)) {
      throw new Error(`Expected FaithConnectHub foreign key is missing: ${key}`);
    }
  }

  assertEqual(
    "FaithConnectHub non-target organization memberships",
    await scalar(
      client,
      `SELECT count(*) FROM organization_memberships
       WHERE organization_id = $1 AND NOT (user_id = ANY($2::uuid[]))`,
      [IDS.faithConnectHubOrganization, targetIds]
    ),
    0
  );
  assertEqual(
    "FaithConnectHub churches",
    await scalar(client, "SELECT count(*) FROM churches WHERE organization_id = $1", [
      IDS.faithConnectHubOrganization,
    ]),
    0
  );
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const parsedUrl = new URL(databaseUrl);
if (parsedUrl.hostname !== EXPECTED_HOST || parsedUrl.pathname.slice(1) !== EXPECTED_DATABASE) {
  throw new Error("Refusing to run: DATABASE_URL does not match the audited Neon endpoint.");
}

const execute = process.argv.includes("--execute");
const confirmed = requiredArg("confirm") === CONFIRMATION;
if (execute && !confirmed) {
  throw new Error(`Refusing writes without --confirm=${CONFIRMATION}`);
}

const client = new pg.Client({ connectionString: databaseUrl });
const deleted = {};

try {
  await client.connect();
  await client.query(
    execute
      ? "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ WRITE"
      : "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY"
  );
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query("SET LOCAL statement_timeout = '60s'");

  const targetResult = await client.query(
    `SELECT id, email
     FROM users
     WHERE email = ANY($1::text[])
     ORDER BY email
     ${execute ? "FOR UPDATE" : ""}`,
    [TARGET_EMAILS]
  );
  assertEqual("target users", targetResult.rowCount ?? 0, EXPECTED.users);
  const targetIds = targetResult.rows.map((row) => row.id);
  const expectedTargets = new Map([
    ["futureblock07@gmail.com", IDS.futureBlock07],
    ["futureblockdev@gmail.com", IDS.futureBlockDev],
    ["learnemmu@gmail.com", IDS.learnEmmu],
  ]);
  for (const target of targetResult.rows) {
    if (expectedTargets.get(target.email) !== target.id) {
      throw new Error(`Target identity changed for ${target.email}.`);
    }
  }

  const successor = await client.query(
    `SELECT u.id, u.email_verified_at, u.organization_id, u.active_church_id,
            cm.role, cm.status
     FROM users u
     JOIN church_memberships cm
       ON cm.user_id = u.id AND cm.church_id = $2
     WHERE u.id = $1`,
    [IDS.graceSuccessor, IDS.graceChurch]
  );
  assertEqual("Grace successor", successor.rowCount ?? 0, 1);
  const successorRow = successor.rows[0];
  if (
    !successorRow.email_verified_at ||
    successorRow.organization_id !== IDS.graceOrganization ||
    successorRow.active_church_id !== IDS.graceChurch ||
    successorRow.role !== "church_admin" ||
    successorRow.status !== "active" ||
    targetIds.includes(successorRow.id)
  ) {
    throw new Error("Grace successor is no longer an eligible non-target church admin.");
  }

  const countWhereTarget = (table, column) =>
    scalar(
      client,
      `SELECT count(*) FROM "${table}" WHERE "${column}" = ANY($1::uuid[])`,
      [targetIds]
    );

  const preflight = {
    notificationReads: await countWhereTarget("notification_reads", "user_id"),
    notifications: await countWhereTarget("notifications", "user_id"),
    favorites: await countWhereTarget("favorites", "user_id"),
    recentlyViewed: await countWhereTarget("recently_viewed", "user_id"),
    prayerIntercessions: await countWhereTarget("prayer_intercessions", "user_id"),
    prayerResponses: await countWhereTarget("prayer_responses", "author_id"),
    videoShortLikes: await countWhereTarget("video_short_likes", "user_id"),
    videoShortComments: await countWhereTarget("video_short_comments", "user_id"),
    communityMessages: await countWhereTarget("church_community_messages", "user_id"),
    churchMemberships: await countWhereTarget("church_memberships", "user_id"),
    organizationMemberships: await countWhereTarget("organization_memberships", "user_id"),
    videoShortsToReassign: await scalar(
      client,
      "SELECT count(*) FROM video_shorts WHERE user_id = $1",
      [IDS.learnEmmu]
    ),
    faithSubscriptions: await scalar(
      client,
      "SELECT count(*) FROM subscriptions WHERE organization_id = $1",
      [IDS.faithConnectHubOrganization]
    ),
    faithTrialEvents: await scalar(
      client,
      "SELECT count(*) FROM trial_lifecycle_events WHERE organization_id = $1",
      [IDS.faithConnectHubOrganization]
    ),
    faithOrganizations: await scalar(
      client,
      "SELECT count(*) FROM organizations WHERE id = $1 AND owner_id = ANY($2::uuid[])",
      [IDS.faithConnectHubOrganization, targetIds]
    ),
    graceNonTargetMembers: await scalar(
      client,
      `SELECT count(*) FROM church_memberships
       WHERE church_id = $1 AND NOT (user_id = ANY($2::uuid[]))`,
      [IDS.graceChurch, targetIds]
    ),
    graceNonTargetActiveContexts: await scalar(
      client,
      `SELECT count(*) FROM users
       WHERE NOT (id = ANY($1::uuid[]))
         AND (organization_id = $2 OR active_church_id = $3)`,
      [targetIds, IDS.graceOrganization, IDS.graceChurch]
    ),
    migrationRows: await scalar(client, "SELECT count(*) FROM drizzle.__drizzle_migrations"),
  };

  for (const [key, value] of Object.entries(preflight)) {
    assertEqual(key, value, EXPECTED[key]);
  }

  await assertFaithConnectHubIsolation(client, targetIds);
  assertEqual(
    "FaithConnectHub non-target contexts",
    await scalar(
      client,
      `SELECT count(*) FROM users
       WHERE NOT (id = ANY($1::uuid[]))
         AND (
           organization_id = $2
           OR active_church_id IN (SELECT id FROM churches WHERE organization_id = $2)
           OR pending_church_id IN (SELECT id FROM churches WHERE organization_id = $2)
         )`,
      [targetIds, IDS.faithConnectHubOrganization]
    ),
    0
  );
  assertEqual(
    "non-target reads of target notifications",
    await scalar(
      client,
      `SELECT count(*) FROM notification_reads r
       JOIN notifications n ON n.id = r.notification_id
       WHERE n.user_id = ANY($1::uuid[]) AND NOT (r.user_id = ANY($1::uuid[]))`,
      [targetIds]
    ),
    0
  );
  assertEqual(
    "non-target replies to target short comments",
    await scalar(
      client,
      `SELECT count(*) FROM video_short_comments child
       JOIN video_short_comments parent ON parent.id = child.parent_id
       WHERE parent.user_id = ANY($1::uuid[]) AND NOT (child.user_id = ANY($1::uuid[]))`,
      [targetIds]
    ),
    0
  );
  assertEqual(
    "non-target community-message dependencies",
    await scalar(
      client,
      `WITH target_messages AS (
         SELECT id FROM church_community_messages WHERE user_id = ANY($1::uuid[])
       )
       SELECT
         (SELECT count(*) FROM church_community_messages
          WHERE reply_to_message_id IN (SELECT id FROM target_messages)
            AND NOT (user_id = ANY($1::uuid[])))
       + (SELECT count(*) FROM church_community_message_reactions
          WHERE message_id IN (SELECT id FROM target_messages)
            AND NOT (user_id = ANY($1::uuid[])))
       + (SELECT count(*) FROM church_community_message_reports
          WHERE message_id IN (SELECT id FROM target_messages)
            AND NOT (reporter_user_id = ANY($1::uuid[]))) AS count`,
      [targetIds]
    ),
    0
  );
  assertEqual(
    "non-target prayer-response dependencies",
    await scalar(
      client,
      `WITH target_responses AS (
         SELECT id FROM prayer_responses WHERE author_id = ANY($1::uuid[])
       )
       SELECT
         (SELECT count(*) FROM prayer_responses
          WHERE parent_id IN (SELECT id FROM target_responses)
            AND NOT (author_id = ANY($1::uuid[])))
       + (SELECT count(*) FROM prayer_response_likes
          WHERE response_id IN (SELECT id FROM target_responses)
            AND NOT (user_id = ANY($1::uuid[])))
       + (SELECT count(*) FROM prayer_response_reports
          WHERE response_id IN (SELECT id FROM target_responses)
            AND NOT (user_id = ANY($1::uuid[]))) AS count`,
      [targetIds]
    ),
    0
  );
  assertEqual(
    "non-target destructive short dependencies",
    await scalar(
      client,
      `WITH target_shorts AS (
         SELECT id FROM video_shorts WHERE user_id = $1
       )
       SELECT
         (SELECT count(*) FROM video_short_comments
          WHERE short_id IN (SELECT id FROM target_shorts)
            AND NOT (user_id = ANY($2::uuid[])))
       + (SELECT count(*) FROM video_short_reports
          WHERE short_id IN (SELECT id FROM target_shorts)
            AND NOT (user_id = ANY($2::uuid[]))) AS count`,
      [IDS.learnEmmu, targetIds]
    ),
    0
  );

  const schemaBefore = await schemaFingerprint(client);

  if (!execute) {
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ mode: "read-only", targetUsers: EXPECTED.users, preflight }, null, 2));
    process.exit(0);
  }

  const successorMembership = await client.query(
    `INSERT INTO organization_memberships
       (organization_id, user_id, role, status)
     VALUES ($1, $2, 'owner', 'active')
     ON CONFLICT (organization_id, user_id)
     DO UPDATE SET role = 'owner', status = 'active', updated_at = NOW()`,
    [IDS.graceOrganization, IDS.graceSuccessor]
  );
  assertEqual("successor organization membership", successorMembership.rowCount ?? 0, 1);

  const ownerTransfer = await client.query(
    `UPDATE organizations
     SET owner_id = $1, updated_at = NOW()
     WHERE id = $2 AND owner_id = $3`,
    [IDS.graceSuccessor, IDS.graceOrganization, IDS.learnEmmu]
  );
  assertEqual("Grace owner transfer", ownerTransfer.rowCount ?? 0, 1);

  const shortTransfer = await client.query(
    `UPDATE video_shorts
     SET user_id = $1, updated_at = NOW()
     WHERE user_id = $2
       AND organization_id = $3
       AND church_id = $4`,
    [IDS.graceSuccessor, IDS.learnEmmu, IDS.graceOrganization, IDS.graceChurch]
  );
  assertEqual(
    "Grace short reassignment",
    shortTransfer.rowCount ?? 0,
    EXPECTED.videoShortsToReassign
  );

  const deletionSpecs = [
    ["notificationReads", "DELETE FROM notification_reads WHERE user_id = ANY($1::uuid[])", EXPECTED.notificationReads],
    ["notifications", "DELETE FROM notifications WHERE user_id = ANY($1::uuid[])", EXPECTED.notifications],
    ["favorites", "DELETE FROM favorites WHERE user_id = ANY($1::uuid[])", EXPECTED.favorites],
    ["recentlyViewed", "DELETE FROM recently_viewed WHERE user_id = ANY($1::uuid[])", EXPECTED.recentlyViewed],
    ["prayerIntercessions", "DELETE FROM prayer_intercessions WHERE user_id = ANY($1::uuid[])", EXPECTED.prayerIntercessions],
    ["prayerResponses", "DELETE FROM prayer_responses WHERE author_id = ANY($1::uuid[])", EXPECTED.prayerResponses],
    ["videoShortLikes", "DELETE FROM video_short_likes WHERE user_id = ANY($1::uuid[])", EXPECTED.videoShortLikes],
    ["videoShortComments", "DELETE FROM video_short_comments WHERE user_id = ANY($1::uuid[])", EXPECTED.videoShortComments],
    ["communityMessages", "DELETE FROM church_community_messages WHERE user_id = ANY($1::uuid[])", EXPECTED.communityMessages],
    ["churchMemberships", "DELETE FROM church_memberships WHERE user_id = ANY($1::uuid[])", EXPECTED.churchMemberships],
    ["organizationMemberships", "DELETE FROM organization_memberships WHERE user_id = ANY($1::uuid[])", EXPECTED.organizationMemberships],
  ];

  for (const [label, sql, expected] of deletionSpecs) {
    deleted[label] = await deleteExactly(client, label, sql, [targetIds], expected);
  }

  deleted.faithTrialEvents = await deleteExactly(
    client,
    "FaithConnectHub trial events",
    "DELETE FROM trial_lifecycle_events WHERE organization_id = $1",
    [IDS.faithConnectHubOrganization],
    EXPECTED.faithTrialEvents
  );
  deleted.faithSubscriptions = await deleteExactly(
    client,
    "FaithConnectHub subscription",
    "DELETE FROM subscriptions WHERE organization_id = $1",
    [IDS.faithConnectHubOrganization],
    EXPECTED.faithSubscriptions
  );
  for (const reference of await foreignKeysReferencing(client, "organizations")) {
    const remaining = await scalar(
      client,
      `SELECT count(*) FROM "${reference.table_name}"
       WHERE "${reference.column_name}" = $1`,
      [IDS.faithConnectHubOrganization]
    );
    const expected = reference.table_name === "users" && reference.column_name === "organization_id"
      ? 1
      : 0;
    assertEqual(
      `pre-delete FaithConnectHub reference ${reference.table_name}.${reference.column_name}`,
      remaining,
      expected
    );
  }
  deleted.faithOrganization = await deleteExactly(
    client,
    "FaithConnectHub organization",
    "DELETE FROM organizations WHERE id = $1",
    [IDS.faithConnectHubOrganization],
    EXPECTED.faithOrganizations
  );
  for (const reference of await foreignKeysReferencing(client, "users")) {
    const remaining = await scalar(
      client,
      `SELECT count(*) FROM "${reference.table_name}"
       WHERE "${reference.column_name}" = ANY($1::uuid[])`,
      [targetIds]
    );
    if (reference.delete_rule !== "SET NULL") {
      assertEqual(
        `remaining ${reference.delete_rule} user reference ${reference.table_name}.${reference.column_name}`,
        remaining,
        0
      );
    }
  }
  deleted.users = await deleteExactly(
    client,
    "target users",
    "DELETE FROM users WHERE id = ANY($1::uuid[])",
    [targetIds],
    EXPECTED.users
  );

  assertEqual(
    "remaining target users",
    await scalar(client, "SELECT count(*) FROM users WHERE email = ANY($1::text[])", [
      TARGET_EMAILS,
    ]),
    0
  );
  assertEqual(
    "preserved Grace organization",
    await scalar(
      client,
      "SELECT count(*) FROM organizations WHERE id = $1 AND owner_id = $2",
      [IDS.graceOrganization, IDS.graceSuccessor]
    ),
    1
  );
  assertEqual(
    "preserved Grace church",
    await scalar(client, "SELECT count(*) FROM churches WHERE id = $1", [IDS.graceChurch]),
    1
  );
  assertEqual(
    "preserved Grace non-target memberships",
    await scalar(client, "SELECT count(*) FROM church_memberships WHERE church_id = $1", [
      IDS.graceChurch,
    ]),
    EXPECTED.graceNonTargetMembers
  );
  assertEqual(
    "reassigned Grace shorts",
    await scalar(
      client,
      "SELECT count(*) FROM video_shorts WHERE organization_id = $1 AND church_id = $2 AND user_id = $3",
      [IDS.graceOrganization, IDS.graceChurch, IDS.graceSuccessor]
    ),
    EXPECTED.videoShortsToReassign
  );
  assertEqual(
    "preserved non-target short likes",
    await scalar(
      client,
      `SELECT count(*) FROM video_short_likes l
       JOIN video_shorts s ON s.id = l.short_id
       WHERE s.organization_id = $1 AND NOT (l.user_id = $2)`,
      [IDS.graceOrganization, IDS.graceSuccessor]
    ),
    EXPECTED.nonTargetLikesOnReassignedShorts
  );
  assertEqual(
    "preserved migration history",
    await scalar(client, "SELECT count(*) FROM drizzle.__drizzle_migrations"),
    EXPECTED.migrationRows
  );

  const schemaAfter = await schemaFingerprint(client);
  if (JSON.stringify(schemaAfter) !== JSON.stringify(schemaBefore)) {
    throw new Error("Schema fingerprint changed during cleanup.");
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ mode: "executed", deleted, verified: true }, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(error instanceof Error ? error.message : "Cleanup failed.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
