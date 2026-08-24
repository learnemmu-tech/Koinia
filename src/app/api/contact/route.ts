import { NextResponse } from "next/server";

import { triggerContactEmails } from "@/lib/email/triggers";
import { contactFormSchema } from "@/lib/contact-validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check your form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    triggerContactEmails({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out. We'll get back to you soon.",
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
