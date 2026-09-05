import "server-only";

import {
  getEventById as loadEventById,
  getEventsByIds as loadEventsByIds,
  listEvents,
} from "@/lib/postgres/features";
import {
  filterPublishedEvents,
  splitEventsBySchedule,
} from "@/lib/event-firestore";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { FirebaseEvent } from "@/types/firebase-event";

export async function getEvents(scope: TenantScope): Promise<FirebaseEvent[]> {
  return listEvents(scope);
}

export async function getPublishedEvents(
  scope: TenantScope
): Promise<FirebaseEvent[]> {
  return filterPublishedEvents(await listEvents(scope));
}

export async function getUpcomingPublishedEvents(
  scope: TenantScope,
  limit = 3
): Promise<FirebaseEvent[]> {
  const { upcoming } = splitEventsBySchedule(await getPublishedEvents(scope));
  return upcoming.slice(0, limit);
}

export async function getPublishedEventsGrouped(scope: TenantScope) {
  return splitEventsBySchedule(await getPublishedEvents(scope));
}

export async function searchEvents(
  scope: TenantScope,
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
