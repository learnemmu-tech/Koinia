import "server-only";

import { registerUserForEvent as registerInPostgres } from "@/lib/postgres/features";
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
  const result = await registerInPostgres(input);
  if (result.ok && !result.alreadyRegistered) {
    void triggerEventRegistrationEmails({
      eventId: input.eventId,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
    });
  }
  return result;
}
