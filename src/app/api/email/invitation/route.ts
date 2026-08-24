import { NextResponse } from "next/server";

import { InvitationEmail } from "@/emails/templates/invitation-email";
import { sendEmail } from "@/lib/email/send-email";
import { verifyBearerToken } from "@/lib/email/verify-auth";

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      inviteLink?: string;
      role?: string;
    };

    const email = body.email?.trim();
    const inviteLink = body.inviteLink?.trim();
    const role = body.role ?? "member";

    if (!email || !inviteLink) {
      return NextResponse.json(
        { error: "email and inviteLink are required" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: email,
      subject: "You're invited to join FaithConnectHub",
      react: InvitationEmail({ role, inviteLink }),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/invitation]", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
