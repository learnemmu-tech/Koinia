/**
 * Development-only reset: wipes Firestore data, Auth users, Firebase Storage,
 * and local /public/uploads test files. Does NOT touch rules, indexes, or schema.
 *
 * Usage:
 *   node scripts/dev-reset.mjs --coynfirm
 *
 * Requires firebase-service-account.json (or FIREBASE_SERVICE_ACCOUNT_PATH).
 */

import { readFileSync, readdirSync, rmSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const PROJECT_ID = "faithconnecthub-a4e6b";
const DEFAULT_BUCKET = "faithconnecthub-a4e6b.firebasestorage.app";

/** Known application collections (from firestore.rules + codebase). */
const KNOWN_COLLECTIONS = [
  "churches",
  "organizations",
  "memberships",
  "branches",
  "branchMemberships",
  "invitations",
  "songs",
  "sermons",
  "ceremonies",
  "articles",
  "events",
  "eventRegistrations",
  "donationCampaigns",
  "donations",
  "recentlyViewed",
  "prayerRequests",
  "prayerIntercessions",
  "notifications",
  "favorites",
  "users",
  "subscriptions",
];

function loadServiceAccount() {
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    "./firebase-service-account.json";
  const absolutePath = resolve(process.cwd(), filePath);
  const raw = readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (parsed.project_id && parsed.project_id !== PROJECT_ID) {
    throw new Error(
      `Service account project_id is "${parsed.project_id}", expected "${PROJECT_ID}".`
    );
  }

  return parsed;
}

function initAdmin(serviceAccount) {
  if (getApps().length > 0) return getApps()[0];

  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    serviceAccount.storage_bucket?.trim() ||
    DEFAULT_BUCKET;

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: PROJECT_ID,
    storageBucket: bucket,
  });
}

async function deleteRootCollection(db, collectionId) {
  const collectionRef = db.collection(collectionId);
  let deletedDocs = 0;

  while (true) {
    const snapshot = await collectionRef.limit(100).get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      await db.recursiveDelete(doc.ref);
      deletedDocs += 1;
    }
  }

  return deletedDocs;
}

async function wipeFirestore(db) {
  const discovered = (await db.listCollections()).map((c) => c.id);
  const toDelete = [...new Set([...KNOWN_COLLECTIONS, ...discovered])].sort();

  console.log("\nFirestore collections to wipe:");
  for (const name of toDelete) {
    console.log(`  - ${name}`);
  }

  const results = {};
  for (const collectionId of toDelete) {
    const count = await deleteRootCollection(db, collectionId);
    results[collectionId] = count;
    if (count > 0) {
      console.log(`  deleted ${count} root doc(s) from ${collectionId}`);
    }
  }

  const remaining = await db.listCollections();
  if (remaining.length > 0) {
    console.warn(
      "Warning: collections still present after wipe:",
      remaining.map((c) => c.id).join(", ")
    );
  }

  return results;
}

async function wipeAuthUsers(auth) {
  let total = 0;
  let nextPageToken;

  do {
    const page = await auth.listUsers(1000, nextPageToken);
    const uids = page.users.map((u) => u.uid);
    if (uids.length > 0) {
      const result = await auth.deleteUsers(uids);
      total += result.successCount;
      if (result.failureCount > 0) {
        console.warn(
          `Auth delete failures: ${result.failureCount}`,
          result.errors
        );
      }
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  return total;
}

async function wipeFirebaseStorage(app, serviceAccount) {
  const candidates = [
    process.env.FIREBASE_STORAGE_BUCKET?.trim(),
    serviceAccount.storage_bucket?.trim(),
    DEFAULT_BUCKET,
    `${PROJECT_ID}.appspot.com`,
  ].filter(Boolean);

  const tried = new Set();
  for (const bucketName of candidates) {
    if (tried.has(bucketName)) continue;
    tried.add(bucketName);

    const bucket = getStorage(app).bucket(bucketName);
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`   Bucket not found, skipping: ${bucketName}`);
        continue;
      }

      const [files] = await bucket.getFiles({ autoPaginate: true });
      if (files.length === 0) {
        console.log(`   Bucket empty: ${bucketName}`);
        return { bucketName, deleted: 0 };
      }

      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(
          batch.map((file) => file.delete({ ignoreNotFound: true }))
        );
      }

      return { bucketName, deleted: files.length };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error ?
          error.code
        : null;
      if (code === 404) {
        console.log(`   Bucket not found, skipping: ${bucketName}`);
        continue;
      }
      throw error;
    }
  }

  console.log("   No Firebase Storage bucket found; skipping remote storage.");
  return { bucketName: null, deleted: 0 };
}

function wipeLocalUploads() {
  const uploadsRoot = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
    return 0;
  }

  let removed = 0;
  const subdirs = ["cover", "audio", "images"];

  for (const subdir of subdirs) {
    const dir = join(uploadsRoot, subdir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      continue;
    }

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      rmSync(join(dir, entry.name), { force: true });
      removed += 1;
    }
  }

  return removed;
}

async function main() {
  const confirmed = process.argv.includes("--confirm");
  if (!confirmed) {
    console.error(
      "Refusing to run without --confirm. This permanently deletes development data."
    );
    console.error("  node scripts/dev-reset.mjs --confirm");
    process.exit(1);
  }

  console.log(`\n=== FaithConnectHub DEV RESET (${PROJECT_ID}) ===\n`);

  const serviceAccount = loadServiceAccount();
  const app = initAdmin(serviceAccount);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    serviceAccount.storage_bucket?.trim() ||
    DEFAULT_BUCKET;

  console.log("1/4 Wiping Firestore...");
  const firestoreResults = await wipeFirestore(db);
  const firestoreTotal = Object.values(firestoreResults).reduce((a, b) => a + b, 0);
  console.log(`   Done. ${firestoreTotal} root document(s) removed.`);

  console.log("2/4 Deleting Firebase Auth users...");
  const authDeleted = await wipeAuthUsers(auth);
  console.log(`   Done. ${authDeleted} user(s) removed.`);

  console.log("3/4 Clearing Firebase Storage...");
  const storageResult = await wipeFirebaseStorage(app, serviceAccount);
  if (storageResult.bucketName) {
    console.log(
      `   Done. ${storageResult.deleted} file(s) removed from ${storageResult.bucketName}.`
    );
  } else {
    console.log("   Done. No remote storage bucket to clear.");
  }

  console.log("4/4 Clearing local /public/uploads...");
  const localDeleted = wipeLocalUploads();
  console.log(`   Done. ${localDeleted} local file(s) removed.`);

  console.log("\n=== Development reset complete ===");
  console.log("The app should now behave like a fresh installation.");
  console.log("Register a new user to start onboarding from scratch.\n");
}

main().catch((error) => {
  console.error("\nDev reset failed:", error);
  process.exit(1);
});
