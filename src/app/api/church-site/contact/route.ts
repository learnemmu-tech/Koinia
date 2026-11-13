import { NextResponse } from "next/server";

import { churchContactSchema } from "@/lib/church-contact-validation";
import { EmailService } from "@/lib/email";
import { listChurchAdminAppUsers } from "@/lib/postgres/features";
import { getUsersByIds } from "@/lib/postgres/session";
import { getChurchBySlug } from "@/lib/postgres/tenants";
import { rateLimitContactRequest } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  // PUBLIC_MUTATION: church contact form is intentionally unauthenticated and rate limited.
  const rate = await rateLimitContactRequest(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body && typeof body === "object" && ("to" in body || "recipient" in body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = churchContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 }
    );
  }

  const church = await getChurchBySlug(parsed.data.churchSlug);
  if (!church) {
    return NextResponse.json({ error: "Church not found." }, { status: 404 });
  }

  const admins = await listChurchAdminAppUsers(church.id, church.organizationId);
  const profiles = await getUsersByIds(admins.map((admin) => admin.userId));
  const recipients = [
    ...new Set(
      [
        ...profiles.map((profile) => profile.email?.trim().toLowerCase() ?? ""),
        church.email?.trim().toLowerCase() ?? "",
      ].filter((email) => email.includes("@") && !email.includes("\n") && !email.includes("\r"))
    ),
  ];

  if (recipients.length === 0) {
    return NextResponse.json(
      {
        error:
          "This church does not have an administrator email configured, so the message was not sent.",
      },
      { status: 503 }
    );
  }

  const result = await EmailService.notifyAdminTo(recipients, {
    type: "contact_form",
    title: `Contact form: ${parsed.data.subject}`,
    summary: `${parsed.data.name} sent a message to ${church.name}.`,
    details: {
      Church: church.name,
      Name: parsed.data.name,
      Email: parsed.data.email,
      Phone: parsed.data.phone?.trim() || "—",
      Subject: parsed.data.subject,
      Message: parsed.data.message,
    },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "The email service could not deliver this message. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
