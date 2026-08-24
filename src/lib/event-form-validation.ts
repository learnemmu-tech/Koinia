import { startOfDay } from "date-fns";
import { z } from "zod";

import { EVENT_TYPES } from "@/types/firebase-event";

export const EVENT_TIME_HOURS = [
  "12",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
] as const;

export const EVENT_TIME_MINUTES = ["00", "30"] as const;

export const EVENT_TIME_PERIODS = ["AM", "PM"] as const;

export type EventTimePeriod = (typeof EVENT_TIME_PERIODS)[number];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function parseEventDateString(value: string): Date | undefined {
  if (!ISO_DATE_PATTERN.test(value.trim())) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return startOfDay(date);
}

export function formatEventDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatEventDateLabel(value: string): string {
  const date = parseEventDateString(value);
  if (!date) return "Select event date";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function isPastEventDate(value: string): boolean {
  const date = parseEventDateString(value);
  if (!date) return true;
  return date < startOfToday();
}

export function formatEventTimeValue(
  hour: string,
  minute: string,
  period: EventTimePeriod
): string {
  return `${hour}:${minute} ${period}`;
}

export function parseEventTimeValue(value: string): {
  hour: string;
  minute: string;
  period: EventTimePeriod;
} | null {
  const match = value.trim().match(TIME_PATTERN);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase() as EventTimePeriod;

  if (hour < 1 || hour > 12) return null;
  const minuteNum = Number(minute);
  if (minuteNum < 0 || minuteNum > 59) return null;
  if (!EVENT_TIME_PERIODS.includes(period)) return null;

  return {
    hour: String(hour),
    minute: minute.padStart(2, "0"),
    period,
  };
}

export function createEventFormSchema(initialEventDate?: string) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, "Event title is required.")
      .min(3, "Event title must be at least 3 characters."),
    description: z
      .string()
      .trim()
      .min(1, "Description is required."),
    eventType: z.enum(EVENT_TYPES),
    speakerName: z
      .string()
      .trim()
      .min(1, "Speaker name is required."),
    eventDate: z
      .string()
      .trim()
      .min(1, "Please select an event date.")
      .refine((value) => parseEventDateString(value) !== undefined, {
        message: "Please select an event date.",
      })
      .refine(
        (value) => {
          if (initialEventDate && value === initialEventDate) return true;
          return !isPastEventDate(value);
        },
        { message: "Past dates are not allowed." }
      ),
    eventTime: z
      .string()
      .trim()
      .min(1, "Please select an event time.")
      .refine((value) => parseEventTimeValue(value) !== null, {
        message: "Please select an event time.",
      }),
    location: z
      .string()
      .trim()
      .min(1, "Location is required."),
    status: z.enum(["draft", "published"]),
  });
}

export type EventFormValues = z.infer<ReturnType<typeof createEventFormSchema>>;
