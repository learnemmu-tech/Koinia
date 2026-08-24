export const EVENT_REGISTRATIONS_COLLECTION = "eventRegistrations";

export function buildEventRegistrationId(eventId: string, userId: string): string {
  return `${eventId}_${userId}`;
}
