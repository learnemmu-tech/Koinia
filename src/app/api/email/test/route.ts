import { NextResponse } from "next/server";
import { z } from "zod";

import { emailConfig } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send-email";
import { renderTestEmail, TEST_EMAIL_TYPES } from "@/lib/email/test-templates";

const bodySchema = z.object({
  to: z.string().email(),
  type: z.enum(["all", ...TEST_EMAIL_TYPES]).default("welcome"),
});

/**
 * Development-only. Sends existing templates to the address in the request.
 * POST /api/email/test { "to": "you@example.com", "type": "all" | "welcome" | ... }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Provide your email as { \"to\": \"you@example.com\", \"type\": \"all\" }.",
        types: ["all", ...TEST_EMAIL_TYPES],
      },
      { status: 400 }
    );
  }

  const { to, type } = parsed.data;
  const types = type === "all" ? [...TEST_EMAIL_TYPES] : [type];
  const results: Array<{ type: string; success: boolean; id?: string; error?: string }> = [];

  for (const template of types) {
    const message = renderTestEmail(template);
    const result = await sendEmail({
      to,
      subject: message.subject,
      react: message.react,
    });
    results.push({
      type: template,
      success: result.success,
      id: result.id,
      error: result.error,
    });
  }

  const accepted = results.filter((item) => item.success).length;
  return NextResponse.json(
    {
      accepted,
      failed: results.length - accepted,
      to,
      from: emailConfig.from,
      providerAccepted: accepted > 0 && accepted === results.length,
      inboxDeliveryConfirmed: false,
      results,
    },
    { status: accepted === results.length ? 200 : 502 }
  );
}
