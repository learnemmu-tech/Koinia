import type { FirebaseEvent } from "@/types/firebase-event";

import { getEventStartTimestamp } from "./event-firestore";

function formatIcsDate(timestamp: number): string {
  return new Date(timestamp)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

export function buildGoogleCalendarUrl(event: FirebaseEvent): string {
  const start = getEventStartTimestamp(event);
  const end = start + 2 * 60 * 60 * 1000;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatIcsDate(start)}/${formatIcsDate(end)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: FirebaseEvent): string {
  const start = getEventStartTimestamp(event);
  const end = start + 2 * 60 * 60 * 1000;
  const now = formatIcsDate(Date.now());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FaithConnectHub//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@faithconnecthub`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: FirebaseEvent) {
  const blob = new Blob([buildIcsContent(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^\w\s-]/g, "").trim() || "event"}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 150);
}
