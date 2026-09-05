"use server";

import { userHasRegisteredForEvent } from "@/lib/postgres/features";

export async function hasRegisteredForEvent(
  eventId: string,
  userId: string
): Promise<boolean> {
  return userHasRegisteredForEvent(eventId, userId);
}
