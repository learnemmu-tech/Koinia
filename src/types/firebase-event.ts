export const EVENT_TYPES = [
  "Sunday Service",
  "Prayer Meeting",
  "Youth Fellowship",
  "Bible Study",
  "Conference",
  "Special Event",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventStatus = "draft" | "published";

export type FirebaseEvent = {
  id: string;
  churchId: string;
  title: string;
  description: string;
  bannerImage?: string;
  eventType: EventType;
  speakerName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: EventStatus;
  createdAt: number;
  updatedAt: number;
};

export type CreateEventInput = {
  churchId: string;
  title: string;
  description: string;
  bannerImage?: string;
  eventType: EventType;
  speakerName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: EventStatus;
};

export type UpdateEventInput = Partial<CreateEventInput>;
