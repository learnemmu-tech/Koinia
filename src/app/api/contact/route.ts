import { NextResponse } from "next/server";

import { triggerContactEmails } from "@/lib/email/triggers";
import { contactFormSchema } from "@/lib/contact-validation";
import { rateLimitContactRequest } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
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

  if (body && typeof body === "object" && "to" in body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check your form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const organization = parsed.data.organization?.trim() || undefined;
    const result = await triggerContactEmails({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      organization,
    });

    if (!result.success) {
      console.error("[api/contact] Contact inbox send failed:", result.error);
      return NextResponse.json(
        {
          error:
            "We couldn't send your message right now. Please try again in a moment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. Your message was delivered to our team.",
    });
  } catch (error) {
    console.error("[api/contact]", error);
    return NextResponse.json(
      {
        error:
          "We couldn't send your message right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
