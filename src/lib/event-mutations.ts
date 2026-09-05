import "server-only";

import {
  createEvent as insertEvent,
  deleteEvent as removeEvent,
  updateEvent as saveEvent,
} from "@/lib/postgres/features";
import type { CreateEventInput, UpdateEventInput } from "@/types/firebase-event";

export async function createEvent(input: CreateEventInput): Promise<string> {
  return insertEvent(input);
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<void> {
  await saveEvent(eventId, input);
}

export async function deleteEvent(eventId: string): Promise<void> {
  await removeEvent(eventId);
}
