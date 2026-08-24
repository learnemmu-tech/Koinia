import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";

import { db } from "./firebase";
import {
  buildPrayerIntercessionId,
  buildPrayerRequestCreatePayload,
  PRAYER_INTERCESSIONS_COLLECTION,
  PRAYER_REQUESTS_COLLECTION,
} from "./prayer-request-firestore";
import { wrapFirebaseError } from "./firebase-utils";
import { mergeClientTenantFields } from "./organization/tenant-scope";
import {
  sanitizePrayerRequestInput,
  type PrayerRequestSubmitValues,
} from "./prayer-request-validation";

/**
 * Client-side Firestore writes — must run in the browser with Firebase Auth
 * so security rules see request.auth (server actions do not attach auth).
 */
export async function createPrayerRequest(
  churchId: string,
  userId: string,
  values: PrayerRequestSubmitValues,
  options?: { email?: string | null; organizationId?: string; branchId?: string }
): Promise<string> {
  const sanitized = sanitizePrayerRequestInput(values);
  const basePayload = buildPrayerRequestCreatePayload({
    ...sanitized,
    churchId,
    userId,
    email: sanitized.email ?? options?.email?.trim() ?? undefined,
  });
  const payload = mergeClientTenantFields(basePayload, {
    organizationId: options?.organizationId,
    churchId,
    branchId: options?.branchId,
  });
  const now = Timestamp.now();

  try {
    const docRef = await addDoc(collection(db, PRAYER_REQUESTS_COLLECTION), {
      ...payload,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function recordPrayerIntercession(
  requestId: string,
  userId: string
): Promise<void> {
  if (!requestId.trim() || !userId.trim()) {
    throw new Error("Prayer request and user are required");
  }

  const intercessionRef = doc(
    db,
    PRAYER_INTERCESSIONS_COLLECTION,
    buildPrayerIntercessionId(requestId, userId)
  );
  const requestRef = doc(db, PRAYER_REQUESTS_COLLECTION, requestId);

  try {
    await runTransaction(db, async (transaction) => {
      const [intercessionSnap, requestSnap] = await Promise.all([
        transaction.get(intercessionRef),
        transaction.get(requestRef),
      ]);

      if (intercessionSnap.exists()) {
        throw new Error("You have already prayed for this request");
      }

      if (!requestSnap.exists()) {
        throw new Error("Prayer request not found");
      }

      const data = requestSnap.data();
      if (data.status !== "approved") {
        throw new Error("Prayer request is not available");
      }

      const currentCount = Math.max(0, Math.floor(Number(data.prayerCount ?? 0)));

      transaction.set(intercessionRef, {
        requestId,
        userId,
        createdAt: Timestamp.now(),
      });

      transaction.update(requestRef, {
        prayerCount: currentCount + 1,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function markPrayerRequestAnswered(
  requestId: string,
  userId: string
): Promise<void> {
  if (!requestId.trim() || !userId.trim()) {
    throw new Error("Prayer request and user are required");
  }

  const requestRef = doc(db, PRAYER_REQUESTS_COLLECTION, requestId);

  try {
    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Prayer request not found");
      }

      const data = requestSnap.data();
      if (data.userId !== userId) {
        throw new Error("You can only mark your own prayer requests as answered");
      }

      if (data.isAnswered === true) {
        return;
      }

      transaction.update(requestRef, {
        isAnswered: true,
        answeredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function incrementPrayerCount(requestId: string): Promise<void> {
  if (!requestId.trim()) {
    throw new Error("Prayer request id is required");
  }

  const ref = doc(db, PRAYER_REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error("Prayer request not found");
    }

    const data = snapshot.data();
    if (data.status !== "approved") {
      throw new Error("Prayer request is not available");
    }

    const currentCount = Math.max(0, Math.floor(Number(data.prayerCount ?? 0)));

    transaction.update(ref, {
      prayerCount: currentCount + 1,
      updatedAt: Timestamp.now(),
    });
  });
}

export async function updatePrayerRequestStatus(
  requestId: string,
  status: PrayerRequestStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, PRAYER_REQUESTS_COLLECTION, requestId), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function deletePrayerRequest(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRAYER_REQUESTS_COLLECTION, requestId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
