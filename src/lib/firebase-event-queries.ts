import "server-only";

import {
  getEventById as loadEventById,
  getEventsByIds as loadEventsByIds,
  listEvents,
} from "@/lib/postgres/features";
import {
  splitEventsBySchedule,
} from "@/lib/event-firestore";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import type { FirebaseEvent } from "@/types/firebase-event";

export async function getEvents(scope: ContentQueryInput): Promise<FirebaseEvent[]> {
  return listEvents(scope);
}

export async function getPublishedEvents(
  scope: ContentQueryInput,
  options?: { limit?: number }
): Promise<FirebaseEvent[]> {
  return listEvents(scope, { publishedOnly: true, limit: options?.limit });
}

export async function getUpcomingPublishedEvents(
  scope: ContentQueryInput,
  limit = 3
): Promise<FirebaseEvent[]> {
  const { upcoming } = splitEventsBySchedule(
    await getPublishedEvents(scope, { limit: Math.max(limit * 4, 12) })
  );
  return upcoming.slice(0, limit);
}

export async function getPublishedEventsGrouped(scope: ContentQueryInput) {
  return splitEventsBySchedule(await getPublishedEvents(scope));
}

export async function searchEvents(
  scope: ContentQueryInput,
  searchQuery: string
): Promise<FirebaseEvent[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];
  const events = await getPublishedEvents(scope);
  return events.filter((event) =>
    [
      event.title,
      event.description,
      event.eventType,
      event.speakerName,
      event.location,
      event.eventDate,
      event.eventTime,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export async function getEventById(
  eventId: string
): Promise<FirebaseEvent | null> {
  return loadEventById(eventId);
}

export async function getEventsByIds(ids: string[]): Promise<FirebaseEvent[]> {
  return loadEventsByIds(ids);
}
