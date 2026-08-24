export type {
  AdminNotificationPayload,
  AdminNotificationType,
  EmailNotificationPreferences,
  EmailPreferenceKey,
  SendEmailResult,
} from "./types";

export {
  DEFAULT_EMAIL_PREFERENCES,
  canSendPreferenceEmail,
  normalizeEmailPreferences,
} from "./preferences";

export { EmailService } from "./email-service";
export { dispatchEmail } from "./dispatch";
export { isEmailConfigured } from "./config";
