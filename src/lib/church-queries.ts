"use server";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseChurch } from "@/types/firebase-church";

import {
  CHURCHES_COLLECTION,
  normalizeChurchFromFirestore,
} from "./church-firestore";
import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import {
  isRecoverableAdminError,
  wrapFirebaseError,
} from "./firebase-utils";

function normalizeChurch(
  id: string,
  data: Record<string, unknown>
): FirebaseChurch {
  return normalizeChurchFromFirestore(id, data);
}

async function fetchActiveChurches(): Promise<FirebaseChurch[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(CHURCHES_COLLECTION)
        .where("isActive", "==", true)
        .orderBy("name", "asc")
        .get();

      return snapshot.docs.map((docSnap) =>
        normalizeChurch(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable for active churches:", error);
    }
  }

  try {
    const q = query(
      collection(db, CHURCHES_COLLECTION),
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      normalizeChurch(docSnap.id, docSnap.data() as Record<string, unknown>)
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}

async function fetchAllChurches(): Promise<FirebaseChurch[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(CHURCHES_COLLECTION)
        .orderBy("name", "asc")
        .get();

      return snapshot.docs.map((docSnap) =>
        normalizeChurch(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable for churches:", error);
    }
  }

  // Admin-only listing — client SDK cannot list inactive churches without auth.
  return fetchActiveChurches();
}

export async function getAllChurches(): Promise<FirebaseChurch[]> {
  return fetchAllChurches();
}

export async function getActiveChurches(): Promise<FirebaseChurch[]> {
  return fetchActiveChurches();
}

export async function getChurchById(
  churchId: string
): Promise<FirebaseChurch | null> {
  const trimmedId = churchId.trim();
  if (!trimmedId) return null;

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docSnap = await adminDb
        .collection(CHURCHES_COLLECTION)
        .doc(trimmedId)
        .get();
      if (!docSnap.exists) return null;
      return normalizeChurch(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
    }
  }

  try {
    const docSnap = await getDoc(doc(db, CHURCHES_COLLECTION, trimmedId));
    if (!docSnap.exists()) return null;
    return normalizeChurch(
      docSnap.id,
      docSnap.data() as Record<string, unknown>
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function getChurchBySlug(
  slug: string
): Promise<FirebaseChurch | null> {
  const trimmedSlug = slug.trim().toLowerCase();
  if (!trimmedSlug) return null;

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(CHURCHES_COLLECTION)
        .where("slug", "==", trimmedSlug)
        .limit(1)
        .get();
      const docSnap = snapshot.docs[0];
      if (!docSnap) return null;
      return normalizeChurch(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
    }
  }

  try {
    const q = query(
      collection(db, CHURCHES_COLLECTION),
      where("slug", "==", trimmedSlug),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    const docSnap = snapshot.docs[0];
    if (!docSnap) return null;
    return normalizeChurch(
      docSnap.id,
      docSnap.data() as Record<string, unknown>
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}
