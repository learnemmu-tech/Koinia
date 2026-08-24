"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type {
  CreateChurchInput,
  UpdateChurchInput,
} from "@/types/firebase-church";

import {
  buildChurchCreatePayload,
  buildChurchUpdatePayload,
  CHURCHES_COLLECTION,
} from "./church-firestore";
import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import { wrapFirebaseError } from "./firebase-utils";

export async function createChurch(input: CreateChurchInput): Promise<string> {
  const payload = buildChurchCreatePayload(input);
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection(CHURCHES_COLLECTION).add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      wrapFirebaseError(error);
    }
  }

  try {
    const docRef = await addDoc(collection(db, CHURCHES_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateChurch(
  churchId: string,
  input: UpdateChurchInput
): Promise<void> {
  const payload = buildChurchUpdatePayload(input);
  if (Object.keys(payload).length === 0) return;

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb
        .collection(CHURCHES_COLLECTION)
        .doc(churchId)
        .update({
          ...payload,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return;
    } catch (error) {
      wrapFirebaseError(error);
    }
  }

  try {
    await updateDoc(doc(db, CHURCHES_COLLECTION, churchId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function setChurchActive(
  churchId: string,
  isActive: boolean
): Promise<void> {
  await updateChurch(churchId, { isActive });
}

export async function deleteChurch(churchId: string): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(CHURCHES_COLLECTION).doc(churchId).delete();
      return;
    } catch (error) {
      wrapFirebaseError(error);
    }
  }

  try {
    await deleteDoc(doc(db, CHURCHES_COLLECTION, churchId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
