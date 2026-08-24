import "server-only";

import { Resend } from "resend";

import { emailConfig, isEmailConfigured } from "./config";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(emailConfig.apiKey);
  }

  return resendClient;
}
