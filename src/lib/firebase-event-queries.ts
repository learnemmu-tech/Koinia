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

import type {
  FirebaseEvent,
} from "@/types/firebase-event";

import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import { isRecoverableAdminError, wrapFirebaseError } from "./firebase-utils";
import {
  EVENTS_COLLECTION,
  filterPublishedEvents,
  getEventStartTimestamp,
  normalizeEventFromFirestore,
  splitEventsBySchedule,
} from "./event-firestore";
import type { TenantScope } from "./organization/tenant-scope";
import { fetchTenantCollection } from "./tenant-content-server";
import { filterRecordsByChurch } from "./church-scope";

async function fetchEventsAdmin(): Promise<FirebaseEvent[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(EVENTS_COLLECTION)
      .orderBy("eventDate", "desc")
      .get();

    return snapshot.docs.map((docSnap) =>
      normalizeEventFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await adminDb.collection(EVENTS_COLLECTION).get();
    return snapshot.docs
      .map((docSnap) =>
        normalizeEventFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => getEventStartTimestamp(b) - getEventStartTimestamp(a));
  }
}

async function fetchEventsClient(): Promise<FirebaseEvent[]> {
  try {
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      orderBy("eventDate", "desc")
    );
    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map((docSnap) =>
      normalizeEventFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    return snapshot.docs
      .map((docSnap) =>
        normalizeEventFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => getEventStartTimestamp(b) - getEventStartTimestamp(a));
  }
}

async function fetchAllEvents(): Promise<FirebaseEvent[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      return await fetchEventsAdmin();
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    return await fetchEventsClient();
  } catch (error) {
    wrapFirebaseError(error);
  }
}

async function fetchPublishedEventsAdmin(): Promise<FirebaseEvent[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(EVENTS_COLLECTION)
      .where("status", "==", "published")
      .orderBy("eventDate", "asc")
      .get();

    return snapshot.docs.map((docSnap) =>
      normalizeEventFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await adminDb
      .collection(EVENTS_COLLECTION)
      .where("status", "==", "published")
      .get();

    return snapshot.docs
      .map((docSnap) =>
        normalizeEventFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort(
        (a, b) => getEventStartTimestamp(a) - getEventStartTimestamp(b)
      );
  }
}

async function fetchPublishedEventsClient(): Promise<FirebaseEvent[]> {
  try {
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where("status", "==", "published"),
      orderBy("eventDate", "asc")
    );
    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map((docSnap) =>
      normalizeEventFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await getDocs(
      query(collection(db, EVENTS_COLLECTION), where("status", "==", "published"))
    );
    return snapshot.docs
      .map((docSnap) =>
        normalizeEventFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort(
        (a, b) => getEventStartTimestamp(a) - getEventStartTimestamp(b)
      );
  }
}

async function fetchPublishedEvents(): Promise<FirebaseEvent[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      return await fetchPublishedEventsAdmin();
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    return await fetchPublishedEventsClient();
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function getEvents(scope: TenantScope): Promise<FirebaseEvent[]> {
  return fetchTenantCollection(
    EVENTS_COLLECTION,
    scope,
    (id, data) => normalizeEventFromFirestore(id, data),
    { orderField: "eventDate", defaultBranchId: scope.branchId ?? null }
  );
}

export async function getPublishedEvents(
  scope: TenantScope
): Promise<FirebaseEvent[]> {
  const events = await getEvents(scope);
  return filterPublishedEvents(events);
}

export async function getUpcomingPublishedEvents(
  scope: TenantScope,
  limit = 3
): Promise<FirebaseEvent[]> {
  const published = await getPublishedEvents(scope);
  const { upcoming } = splitEventsBySchedule(filterPublishedEvents(published));
  return upcoming.slice(0, limit);
}

export async function getPublishedEventsGrouped(scope: TenantScope) {
  const published = filterPublishedEvents(await getPublishedEvents(scope));
  return splitEventsBySchedule(published);
}

export async function searchEvents(
  scope: TenantScope,
  searchQuery: string
): Promise<FirebaseEvent[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];

  const events = await getPublishedEvents(scope);
  return events.filter((event) => {
    const haystack = [
      event.title,
      event.description,
      event.eventType,
      event.speakerName,
      event.location,
      event.eventDate,
      event.eventTime,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function getEventById(
  eventId: string
): Promise<FirebaseEvent | null> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(EVENTS_COLLECTION)
        .doc(eventId)
        .get();

      if (snapshot.exists) {
        return normalizeEventFromFirestore(
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
  }

  try {
    const snapshot = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    if (!snapshot.exists()) return null;

    return normalizeEventFromFirestore(
      snapshot.id,
      snapshot.data() as Record<string, unknown>
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}
