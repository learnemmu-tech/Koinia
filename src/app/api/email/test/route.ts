import { NextResponse } from "next/server";
import { z } from "zod";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { emailConfig } from "@/lib/email/config";
import { EmailService } from "@/lib/email/email-service";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

const bodySchema = z.object({
  type: z.enum(["welcome", "article"]).default("welcome"),
  to: z.string().email().optional(),
});

/**
 * Dev email verification — Super Admin only, never available in production.
 * POST /api/email/test { "type": "welcome" | "article", "to": "optional@email.com" }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await getAppUserByClerkId(authUser.uid);
  if (!isPlatformSuperAdmin(appUser?.platformRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const to = body.to ?? emailConfig.adminEmail;

  const result =
    body.type === "article" ?
      await EmailService.sendArticlePublished({
        to,
        userName: "Test User",
        articleTitle: "Test Article — Resend Verification",
        summary:
          "This is a test article notification to verify the Resend email pipeline.",
        articleId: "test-article-id",
      })
    : await EmailService.sendWelcomeEmail({
        to,
        firstName: "Test",
        lastName: "User",
      });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        config: {
          from: emailConfig.from,
          replyTo: emailConfig.replyTo,
          apiKeyConfigured: Boolean(emailConfig.apiKey),
          appUrl: emailConfig.appUrl,
        },
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    id: result.id,
    to,
    type: body.type,
    config: {
      from: emailConfig.from,
      replyTo: emailConfig.replyTo,
      apiKeyConfigured: Boolean(emailConfig.apiKey),
      appUrl: emailConfig.appUrl,
    },
  });
}
