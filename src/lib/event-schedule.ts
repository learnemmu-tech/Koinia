import type { FirebaseEvent } from "@/types/firebase-event";

import {
  getEventDateStartMs,
  getEventStartTimestamp,
  getTodayStartMs,
} from "@/lib/event-firestore";

/** Default duration for timed events when no end time exists (3 hours). */
const DEFAULT_TIMED_EVENT_MS = 3 * 60 * 60 * 1000;

export type EventScheduleStatus =
  | "live_now"
  | "today"
  | "tomorrow"
  | "in_days"
  | "this_week"
  | "later";

export type EventScheduleInfo = {
  status: EventScheduleStatus;
  label: string;
  daysUntil: number | null;
  showPulse: boolean;
  tone: "urgent" | "soon" | "week" | "normal";
  countdownLabel: string | null;
};

export function getEventEndTimestamp(event: FirebaseEvent): number {
  const start = getEventStartTimestamp(event);
  const dayStart = getEventDateStartMs(event.eventDate);

  if (start <= 0) {
    if (dayStart == null) return 0;
    return dayStart + 24 * 60 * 60 * 1000 - 1;
  }

  if (!event.eventTime.trim()) {
    if (dayStart == null) return start + DEFAULT_TIMED_EVENT_MS;
    return dayStart + 24 * 60 * 60 * 1000 - 1;
  }

  return start + DEFAULT_TIMED_EVENT_MS;
}

export function isEventEnded(
  event: FirebaseEvent,
  now = Date.now()
): boolean {
  const end = getEventEndTimestamp(event);
  if (end <= 0) return false;
  return now > end;
}

export function isEventLive(event: FirebaseEvent, now = Date.now()): boolean {
  const start = getEventStartTimestamp(event);
  if (start <= 0) return false;
  return now >= start && !isEventEnded(event, now);
}

export function getDaysUntilEventDay(
  event: FirebaseEvent,
  now = Date.now()
): number | null {
  const eventDay = getEventDateStartMs(event.eventDate);
  if (eventDay == null) return null;
  const today = getTodayStartMs(now);
  return Math.round((eventDay - today) / (24 * 60 * 60 * 1000));
}

export function getEventScheduleInfo(
  event: FirebaseEvent,
  now = Date.now()
): EventScheduleInfo {
  if (isEventLive(event, now)) {
    return {
      status: "live_now",
      label: "LIVE NOW",
      daysUntil: 0,
      showPulse: true,
      tone: "urgent",
      countdownLabel: null,
    };
  }

  const daysUntil = getDaysUntilEventDay(event, now);
  const start = getEventStartTimestamp(event);

  if (daysUntil === 0 || (daysUntil == null && start > now)) {
    return {
      status: "today",
      label: "TODAY",
      daysUntil: 0,
      showPulse: true,
      tone: "urgent",
      countdownLabel: formatEventCountdown(event, now),
    };
  }

  if (daysUntil === 1) {
    return {
      status: "tomorrow",
      label: "TOMORROW",
      daysUntil,
      showPulse: true,
      tone: "urgent",
      countdownLabel: formatEventCountdown(event, now),
    };
  }

  if (daysUntil != null && daysUntil >= 2 && daysUntil <= 3) {
    return {
      status: "in_days",
      label: `IN ${daysUntil} DAYS`,
      daysUntil,
      showPulse: false,
      tone: "soon",
      countdownLabel: formatEventCountdown(event, now),
    };
  }

  if (daysUntil != null && daysUntil >= 4 && daysUntil <= 7) {
    return {
      status: "this_week",
      label: "THIS WEEK",
      daysUntil,
      showPulse: false,
      tone: "week",
      countdownLabel: formatEventCountdown(event, now),
    };
  }

  return {
    status: "later",
    label: "",
    daysUntil,
    showPulse: false,
    tone: "normal",
    countdownLabel: null,
  };
}

export function formatEventCountdown(
  event: FirebaseEvent,
  now = Date.now()
): string | null {
  if (isEventLive(event, now)) return null;

  const start = getEventStartTimestamp(event);
  if (start <= 0 || start <= now) return null;

  const diffMs = start - now;
  const totalMinutes = Math.max(1, Math.floor(diffMs / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 2) {
    return `Starts in ${days}d ${hours}h`;
  }
  if (days === 1) {
    return `Starts in 1d ${hours}h`;
  }
  if (hours >= 1) {
    return `Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${minutes}m`;
}

export function compareHomeEvents(
  a: FirebaseEvent,
  b: FirebaseEvent,
  now = Date.now()
): number {
  const aLive = isEventLive(a, now);
  const bLive = isEventLive(b, now);
  if (aLive !== bLive) return aLive ? -1 : 1;

  const aStart = getEventStartTimestamp(a);
  const bStart = getEventStartTimestamp(b);
  if (aStart !== bStart) return aStart - bStart;

  return a.title.localeCompare(b.title);
}

export function getHomeDisplayEvents(
  events: FirebaseEvent[],
  now = Date.now(),
  maxVisible = 3
): {
  highlight: FirebaseEvent | null;
  rest: FirebaseEvent[];
  visible: FirebaseEvent[];
} {
  const eligible = events
    .filter((event) => !isEventEnded(event, now))
    .sort((a, b) => compareHomeEvents(a, b, now));

  const highlight = eligible[0] ?? null;
  const rest = highlight
    ? eligible.filter((event) => event.id !== highlight.id).slice(0, maxVisible - 1)
    : eligible.slice(0, maxVisible);

  return {
    highlight,
    rest,
    visible: highlight ? [highlight, ...rest] : rest,
  };
}
