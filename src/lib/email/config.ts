import "server-only";

import { SUPER_ADMIN_EMAIL } from "@/lib/admin-access";
import { siteConfig } from "@/config/site";

import { resolveReplyToAddress, resolveResendFromAddress } from "./from-address";

function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    siteConfig.url.replace(/\/$/, "");

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }

  return `http://${raw.replace(/\/$/, "")}`;
}

export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY?.trim(),
  from: resolveResendFromAddress(process.env.RESEND_FROM_EMAIL),
  replyTo: resolveReplyToAddress(
    process.env.RESEND_REPLY_TO,
    siteConfig.author.email
  ),
  adminEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ?? SUPER_ADMIN_EMAIL,
  appUrl: getAppUrl(),
  appName: siteConfig.name,
  logoUrl: `${getAppUrl()}${siteConfig.image}`,
  privacyUrl: `${getAppUrl()}/privacy`,
  contactEmail: siteConfig.author.email,
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(emailConfig.apiKey);
}
