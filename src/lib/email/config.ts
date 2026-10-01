import "server-only";

import { siteConfig } from "@/config/site";
import { resolveAppOrigin } from "@/lib/join-url";

import { resolveReplyToAddress, resolveResendFromAddress } from "./from-address";

function getAppUrl(): string {
  return resolveAppOrigin();
}

export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY?.trim(),
  from: resolveResendFromAddress(process.env.RESEND_FROM_EMAIL),
  replyTo: resolveReplyToAddress(
    process.env.RESEND_REPLY_TO,
    siteConfig.author.email
  ),
  adminEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.SUPER_ADMIN_EMAIL?.trim() ||
    "",
  appUrl: getAppUrl(),
  appName: siteConfig.name,
  logoUrl: `${getAppUrl()}${siteConfig.image}`,
  privacyUrl: `${getAppUrl()}/privacy`,
  contactEmail: siteConfig.author.email,
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(emailConfig.apiKey);
}
