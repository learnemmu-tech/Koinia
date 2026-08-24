import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import {
  EVENTS_COLLECTION,
  normalizeEventFromFirestore,
} from "@/lib/event-firestore";
import {
  buildEventRegistrationId,
  EVENT_REGISTRATIONS_COLLECTION,
} from "@/lib/event-registration-firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { triggerEventRegistrationEmails } from "@/lib/email/triggers";

export type RegisterForEventResult =
  | { ok: true; alreadyRegistered: boolean }
  | { ok: false; error: string };

export async function registerUserForEvent(input: {
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<RegisterForEventResult> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { ok: false, error: "Server is not configured." };
  }

  const eventSnap = await adminDb
    .collection(EVENTS_COLLECTION)
    .doc(input.eventId)
    .get();

  if (!eventSnap.exists) {
    return { ok: false, error: "Event not found." };
  }

  const event = normalizeEventFromFirestore(
    eventSnap.id,
    eventSnap.data() as Record<string, unknown>
  );

  if (event.status !== "published") {
    return { ok: false, error: "This event is not open for registration." };
  }

  const registrationId = buildEventRegistrationId(input.eventId, input.userId);
  const registrationRef = adminDb
    .collection(EVENT_REGISTRATIONS_COLLECTION)
    .doc(registrationId);

  const existing = await registrationRef.get();
  if (existing.exists) {
    return { ok: true, alreadyRegistered: true };
  }

  await registrationRef.set({
    eventId: input.eventId,
    userId: input.userId,
    userEmail: input.userEmail.trim(),
    userName: input.userName.trim() || "Guest",
    churchId: event.churchId,
    createdAt: FieldValue.serverTimestamp(),
  });

  void triggerEventRegistrationEmails({
    eventId: input.eventId,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
  });

  return { ok: true, alreadyRegistered: false };
}
