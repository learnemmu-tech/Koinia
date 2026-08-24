import "server-only";

import type { ReactElement } from "react";
import { render } from "@react-email/render";

import { emailConfig, isEmailConfigured } from "./config";
import { getResendClient } from "./client";
import type { SendEmailResult } from "./types";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 750;

function isTransientError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("timeout") ||
    lower.includes("temporarily") ||
    lower.includes("503") ||
    lower.includes("502")
  );
}

/** Turn Resend API errors into actionable messages for operators. */
function formatResendError(error: {
  message?: string;
  statusCode?: number | null;
}): string {
  const message = error.message?.trim() || "Unknown Resend error";

  if (
    error.statusCode === 403 &&
    message.includes("only send testing emails to your own email address")
  ) {
    const accountEmail = message.match(
      /\(([^)]+@[^)]+)\)/
    )?.[1];

    return accountEmail ?
        `Resend sandbox (${emailConfig.from}): can only deliver to ${accountEmail}. ` +
          "Verify a domain at resend.com/domains and set RESEND_FROM_EMAIL to that domain, " +
          "or use the API key for the recipient's Resend account while testing."
      : `Resend sandbox (${emailConfig.from}): ${message}`;
  }

  if (error.statusCode === 422) {
    return `Resend rejected the message (422): ${message}. Check RESEND_FROM_EMAIL format.`;
  }

  return message;
}

function getReactTemplateLabel(element: ReactElement): string {
  const type = element.type;
  if (typeof type === "function") {
    return type.name || "EmailTemplate";
  }
  if (typeof type === "string") {
    return type;
  }
  return "EmailTemplate";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY is not configured — skipping send.");
    return { success: false, error: "Email service not configured" };
  }

  const client = getResendClient();
  if (!client) {
    return { success: false, error: "Email client unavailable" };
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const validRecipients = recipients
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  if (validRecipients.length === 0) {
    return { success: false, error: "No valid recipients" };
  }

  const from = emailConfig.from;
  const replyTo = input.replyTo ?? emailConfig.replyTo;
  const template = getReactTemplateLabel(input.react);

  let lastError = "Unknown email error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const html = await render(input.react);
      const text = await render(input.react, { plainText: true });

      console.info("[email] Resend send attempt", {
        attempt,
        from,
        replyTo,
        to: validRecipients,
        subject: input.subject,
        htmlLength: html.length,
        textLength: text.length,
        template,
        transport: "react-email → html + text",
      });

      const { data, error } = await client.emails.send({
        from,
        to: validRecipients,
        subject: input.subject,
        html,
        text,
        replyTo,
      });

      if (error) {
        lastError = formatResendError(error);
        if (attempt < MAX_ATTEMPTS && isTransientError(lastError)) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        console.error("[email] Resend error:", error);
        return { success: false, error: lastError };
      }

      console.info("[email] Resend accepted", {
        id: data?.id,
        to: validRecipients,
        subject: input.subject,
      });

      return { success: true, id: data?.id };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Failed to send email";
      console.error(`[email] Attempt ${attempt} failed:`, error);

      if (attempt < MAX_ATTEMPTS && isTransientError(lastError)) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  return { success: false, error: lastError };
}
