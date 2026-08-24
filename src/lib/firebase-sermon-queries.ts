"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type {
  CreateSermonInput,
  FirebaseSermon,
  UpdateSermonInput,
} from "@/types/firebase-sermon";

import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import { isRecoverableAdminError, wrapFirebaseError } from "./firebase-utils";
import type { TenantScope } from "./organization/tenant-scope";
import { mergeTenantFieldsIntoPayload } from "./organization/resolve-tenant-scope";
import { fetchTenantCollection } from "./tenant-content-server";
import {
  LEGACY_SERMONS_COLLECTION,
  SERMONS_COLLECTION,
  logSermonFetchDebug,
  mergeSermonsById,
  normalizeSermonFromFirestore,
} from "./sermon-firestore";

async function fetchCollectionAdmin(
  collectionName: string
): Promise<FirebaseSermon[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(collectionName)
      .orderBy("dateCreated", "desc")
      .get();

    return snapshot.docs.map((docSnap) =>
      normalizeSermonFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await adminDb.collection(collectionName).get();
    return snapshot.docs
      .map((docSnap) =>
        normalizeSermonFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.dateCreated - a.dateCreated);
  }
}

async function fetchCollectionClient(
  collectionName: string
): Promise<FirebaseSermon[]> {
  try {
    const q = query(
      collection(db, collectionName),
      orderBy("dateCreated", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      normalizeSermonFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs
      .map((docSnap) =>
        normalizeSermonFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.dateCreated - a.dateCreated);
  }
}

async function fetchFromCollection(
  collectionName: string
): Promise<FirebaseSermon[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      return await fetchCollectionAdmin(collectionName);
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    return await fetchCollectionClient(collectionName);
  } catch (error) {
    wrapFirebaseError(error);
  }
}

async function fetchAllSermons(): Promise<FirebaseSermon[]> {
  const debug: { collection: string; count: number; error?: unknown }[] = [];
  const collections: FirebaseSermon[][] = [];

  for (const collectionName of [SERMONS_COLLECTION, LEGACY_SERMONS_COLLECTION]) {
    try {
      const items = await fetchFromCollection(collectionName);
      debug.push({ collection: collectionName, count: items.length });
      collections.push(items);
    } catch (error) {
      debug.push({ collection: collectionName, count: 0, error });
      console.error(`[sermons] failed to read "${collectionName}"`, error);
    }
  }

  logSermonFetchDebug(debug);

  const merged = mergeSermonsById(collections);
  if (process.env.NODE_ENV !== "production") {
    console.info("[sermons] merged total", { count: merged.length });
  }
  return merged;
}

async function getSermonDocRef(
  sermonId: string
): Promise<{ collectionName: string; exists: boolean } | null> {
  const adminDb = getAdminDb();

  for (const collectionName of [SERMONS_COLLECTION, LEGACY_SERMONS_COLLECTION]) {
    if (adminDb) {
      const snapshot = await adminDb
        .collection(collectionName)
        .doc(sermonId)
        .get();
      if (snapshot.exists) {
        return { collectionName, exists: true };
      }
      continue;
    }

    const snapshot = await getDoc(doc(db, collectionName, sermonId));
    if (snapshot.exists()) {
      return { collectionName, exists: true };
    }
  }

  return null;
}

async function fetchAllSermonsForScope(scope: TenantScope): Promise<FirebaseSermon[]> {
  const [primary, legacy] = await Promise.all([
    fetchTenantCollection(
      SERMONS_COLLECTION,
      scope,
      (id, data) => normalizeSermonFromFirestore(id, data),
      { orderField: "dateCreated", defaultBranchId: scope.branchId ?? null }
    ),
    fetchTenantCollection(
      LEGACY_SERMONS_COLLECTION,
      scope,
      (id, data) => normalizeSermonFromFirestore(id, data),
      { orderField: "dateCreated", defaultBranchId: scope.branchId ?? null }
    ),
  ]);
  return mergeSermonsById([primary, legacy]);
}

export async function getSermons(scope: TenantScope): Promise<FirebaseSermon[]> {
  return fetchAllSermonsForScope(scope);
}

export async function getPublishedSermons(
  scope: TenantScope
): Promise<FirebaseSermon[]> {
  const sermons = await fetchAllSermonsForScope(scope);
  const published = sermons.filter((s) => s.isPublished);
  if (process.env.NODE_ENV !== "production") {
    console.info("[sermons] published count", {
      total: sermons.length,
      published: published.length,
    });
  }
  return published;
}

export async function getSermonById(
  sermonId: string
): Promise<FirebaseSermon | null> {
  const adminDb = getAdminDb();

  for (const collectionName of [SERMONS_COLLECTION, LEGACY_SERMONS_COLLECTION]) {
    if (adminDb) {
      let adminLookupSucceeded = false;
      try {
        const snapshot = await adminDb
          .collection(collectionName)
          .doc(sermonId)
          .get();

        adminLookupSucceeded = true;

        if (snapshot.exists) {
          if (process.env.NODE_ENV !== "production") {
            console.info("[sermons] getSermonById hit", {
              collection: collectionName,
              sermonId,
            });
          }
          return normalizeSermonFromFirestore(
            snapshot.id,
            snapshot.data() as Record<string, unknown>
          );
        }
      } catch (error) {
        if (!isRecoverableAdminError(error)) {
          wrapFirebaseError(error);
        }
        console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
      }

      if (adminLookupSucceeded) {
        continue;
      }
    }

    try {
      const snapshot = await getDoc(doc(db, collectionName, sermonId));
      if (snapshot.exists()) {
        if (process.env.NODE_ENV !== "production") {
          console.info("[sermons] getSermonById hit", {
            collection: collectionName,
            sermonId,
          });
        }
        return normalizeSermonFromFirestore(
          snapshot.id,
          snapshot.data() as Record<string, unknown>
        );
      }
    } catch (error) {
      wrapFirebaseError(error);
    }
  }

  console.warn("[sermons] getSermonById not found", { sermonId });
  return null;
}

export async function searchSermons(
  scope: TenantScope,
  searchQuery: string
): Promise<FirebaseSermon[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];

  const sermons = await getPublishedSermons(scope);
  return sermons.filter((sermon) => {
    const haystack = [
      sermon.title,
      sermon.speaker,
      sermon.scriptureReference,
      sermon.shortDescription,
      ...sermon.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function createSermon(
  sermonData: CreateSermonInput
): Promise<string> {
  const adminDb = getAdminDb();
  const scopedPayload = await mergeTenantFieldsIntoPayload(
    sermonData as Record<string, unknown>,
    sermonData.churchId
  );
  const payload = {
    ...scopedPayload,
    dateCreated: FieldValue.serverTimestamp(),
  };

  if (adminDb) {
    try {
      const docRef = await adminDb.collection(SERMONS_COLLECTION).add(payload);
      return docRef.id;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const clientPayload = await mergeTenantFieldsIntoPayload(
      sermonData as Record<string, unknown>,
      sermonData.churchId
    );
    const docRef = await addDoc(collection(db, SERMONS_COLLECTION), {
      ...clientPayload,
      dateCreated: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateSermon(
  sermonId: string,
  updates: UpdateSermonInput
): Promise<void> {
  const located = await getSermonDocRef(sermonId);
  const collectionName = located?.collectionName ?? SERMONS_COLLECTION;

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(sermonId).update(updates);
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await updateDoc(doc(db, collectionName, sermonId), updates);
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function deleteSermon(sermonId: string): Promise<void> {
  const located = await getSermonDocRef(sermonId);
  if (!located) return;

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(located.collectionName).doc(sermonId).delete();
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await deleteDoc(doc(db, located.collectionName, sermonId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
