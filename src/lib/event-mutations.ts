"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type { CreateEventInput, UpdateEventInput } from "@/types/firebase-event";

import {
  buildEventCreatePayload,
  EVENTS_COLLECTION,
} from "./event-firestore";
import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import {
  isRecoverableAdminError,
  wrapFirebaseError,
} from "./firebase-utils";
import { mergeTenantFieldsIntoPayload } from "./organization/resolve-tenant-scope";

export async function createEvent(input: CreateEventInput): Promise<string> {
  const basePayload = buildEventCreatePayload(input);
  const payload = await mergeTenantFieldsIntoPayload(
    basePayload,
    input.churchId
  );
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection(EVENTS_COLLECTION).add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  const now = Timestamp.now();

  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...payload,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateEvent(
  eventId: string,
  updates: UpdateEventInput
): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(EVENTS_COLLECTION).doc(eventId).update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(EVENTS_COLLECTION).doc(eventId).delete();
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
