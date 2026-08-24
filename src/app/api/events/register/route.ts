import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { registerUserForEvent } from "@/lib/event-registration-server";

const bodySchema = z.object({
  eventId: z.string().trim().min(1),
  userName: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser?.email) {
    return NextResponse.json(
      { error: "Please sign in with an email address to register." },
      { status: 401 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await registerUserForEvent({
    eventId: body.eventId,
    userId: authUser.uid,
    userEmail: authUser.email,
    userName: body.userName?.trim() || authUser.email.split("@")[0] || "Guest",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    alreadyRegistered: result.alreadyRegistered,
    message:
      result.alreadyRegistered ?
        "You are already registered for this event."
      : "You are registered! Check your email for confirmation.",
  });
}
