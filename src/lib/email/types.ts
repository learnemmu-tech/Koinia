export type EmailPreferenceKey =
  | "song"
  | "sermon"
  | "article"
  | "event"
  | "donation"
  | "prayer";

export type EmailNotificationPreferences = {
  song: boolean;
  sermon: boolean;
  article: boolean;
  event: boolean;
  donation: boolean;
  prayer: boolean;
};

export type SendEmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

export type AdminNotificationType =
  | "new_user"
  | "prayer_submitted"
  | "prayer_approved"
  | "donation_received"
  | "event_registration"
  | "contact_form"
  | "join_request";

export type AdminNotificationPayload = {
  type: AdminNotificationType;
  title: string;
  summary: string;
  details?: Record<string, string>;
  actionUrl?: string;
};
