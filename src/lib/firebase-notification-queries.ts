import type {
  FirebaseNotification,
  NotificationContentType,
} from "@/types/firebase-notification";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import {
  notificationDestination,
  sanitizeNotificationDestination,
} from "@/lib/notifications/notification-destination";
import {
  fetchUserNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notification-actions";

export const NOTIFICATION_PRESETS: Record<
  NotificationContentType,
  { title: string; message: string; pathPrefix: string }
> = {
  song: {
    title: "New Song Added",
    message: "A new worship song has been added.",
    pathPrefix: "/songs",
  },
  article: {
    title: "New Article Published",
    message: "A new article is available to read.",
    pathPrefix: "/articles",
  },
  sermon: {
    title: "New Sermon Added",
    message: "A new sermon has been published.",
    pathPrefix: "/sermons",
  },
  event: {
    title: "New Event Published",
    message: "A new ministry event is available.",
    pathPrefix: "/events",
  },
  prayer: {
    title: "Prayer Request Approved",
    message: "A prayer request is now on the prayer wall.",
    pathPrefix: "/prayer-requests",
  },
  prayer_request_submitted: {
    title: "New Prayer Request",
    message: "A member submitted a prayer request for review.",
    pathPrefix: "/dashboard/content",
  },
  membership_approved: {
    title: "Membership Approved",
    message: "Your church membership has been approved.",
    pathPrefix: "/dashboard",
  },
  membership_request: {
    title: "New membership request",
    message: "Someone requested to join your church.",
    pathPrefix: "/dashboard/members",
  },
  book: {
    title: "New Book Published",
    message: "A new book has been published.",
    pathPrefix: "/books",
  },
  trial_lifecycle: {
    title: "Trial update",
    message: "Your FaithConnectHub trial has an important update.",
    pathPrefix: "/dashboard/billing",
  },
  short_pending_review: {
    title: "Short awaiting review",
    message: "A member submitted a Short for review.",
    pathPrefix: "/videos",
  },
  short_review_result: {
    title: "Short review update",
    message: "There is an update on your submitted Short.",
    pathPrefix: "/videos",
  },
  group_invitation: {
    title: "Group invitation",
    message: "You've been invited to join a church group.",
    pathPrefix: "/groups",
  },
};

async function createPublishNotificationViaApi(input: {
  type: NotificationContentType;
  contentId: string;
  contentTitle: string;
  image?: string;
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
}): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    console.warn("[notifications] skipped — not signed in");
    return null;
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/notifications/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to create notifications");
  }

  const data = (await response.json()) as { notificationId?: string | null };
  return data.notificationId ?? null;
}

export async function createPublishNotification(input: {
  type: NotificationContentType;
  contentId: string;
  contentTitle: string;
  image?: string;
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
}): Promise<string | null> {
  if (!input.contentId.trim() || !input.contentTitle.trim()) {
    return null;
  }
  if (!input.churchId?.trim()) {
    return null;
  }
  try {
    return await createPublishNotificationViaApi(input);
  } catch (error) {
    console.error("[notifications] failed to create notification", error, input);
    throw error;
  }
}

export function getNotificationContentPath(
  notification: Pick<FirebaseNotification, "type" | "contentId"> & {
    href?: string | null;
    churchSlug?: string | null;
  }
): string {
  if (notification.href?.trim()) {
    return sanitizeNotificationDestination(notification.href);
  }
  return sanitizeNotificationDestination(
    notificationDestination({
      type: notification.type,
      contentId: notification.contentId,
      churchSlug: notification.churchSlug,
    })
  );
}

export function getNotificationTypeLabel(type: NotificationContentType): string {
  return (NOTIFICATION_PRESETS[type] ?? NOTIFICATION_PRESETS.song).title;
}

type NotificationListener = {
  onChange: (notifications: FirebaseNotification[]) => void;
  onError?: (error: Error) => void;
};

type NotificationBus = {
  listeners: Set<NotificationListener>;
  timer?: ReturnType<typeof setInterval>;
  inFlight?: Promise<void>;
  idleHandle?: number;
  lastItems?: FirebaseNotification[];
  lastFetchedAt?: number;
};

const NOTIFICATION_FRESH_MS = 20_000;

const notificationBuses = new Map<string, NotificationBus>();

function publishNotifications(userId: string) {
  const bus = notificationBuses.get(userId);
  if (!bus || bus.inFlight) return bus?.inFlight;

  bus.inFlight = (async () => {
    try {
      const items = await fetchUserNotifications(userId);
      bus.lastItems = items;
      bus.lastFetchedAt = Date.now();
      for (const listener of bus.listeners) listener.onChange(items);
    } catch (error) {
      const failure =
        error instanceof Error ? error : new Error("Failed to load notifications");
      for (const listener of bus.listeners) listener.onError?.(failure);
    } finally {
      bus.inFlight = undefined;
    }
  })();

  return bus.inFlight;
}

export function subscribeToNotifications(
  userId: string,
  onChange: (notifications: FirebaseNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  let bus = notificationBuses.get(userId);
  if (!bus) {
    bus = { listeners: new Set() };
    notificationBuses.set(userId, bus);
    bus.timer = setInterval(() => {
      const current = notificationBuses.get(userId);
      if (
        current?.lastFetchedAt &&
        Date.now() - current.lastFetchedAt < NOTIFICATION_FRESH_MS
      ) {
        return;
      }
      void publishNotifications(userId);
    }, 20_000);
  }

  const listener = { onChange, onError };
  bus.listeners.add(listener);
  const fresh =
    bus.lastItems &&
    bus.lastFetchedAt &&
    Date.now() - bus.lastFetchedAt < NOTIFICATION_FRESH_MS;
  if (fresh && bus.lastItems) {
    onChange(bus.lastItems);
  } else if (!bus.inFlight && bus.idleHandle == null) {
    const start = () => {
      const current = notificationBuses.get(userId);
      if (!current) return;
      current.idleHandle = undefined;
      void publishNotifications(userId);
    };
    // The bell and the sidebar both subscribe during hydration. Waiting
    // until the browser is idle keeps that server action off the click.
    if (typeof window.requestIdleCallback === "function") {
      bus.idleHandle = window.requestIdleCallback(start, { timeout: 2_000 });
    } else {
      bus.idleHandle = window.setTimeout(start, 1_500);
    }
  }

  return () => {
    const current = notificationBuses.get(userId);
    current?.listeners.delete(listener);
    if (current && current.listeners.size === 0) {
      if (current.timer) clearInterval(current.timer);
      if (current.idleHandle != null) {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(current.idleHandle);
        } else {
          window.clearTimeout(current.idleHandle);
        }
      }
      notificationBuses.delete(userId);
    }
  };
}

export function subscribeToReadNotificationIds(
  userId: string,
  onChange: (readIds: Set<string>) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeToNotifications(
    userId,
    (items) => {
      onChange(new Set(items.filter((item) => item.read).map((item) => item.id)));
    },
    onError
  );
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await markNotificationReadAction(userId, notificationId);
}

export async function markAllNotificationsRead(
  userId: string,
  notificationIds: string[]
): Promise<void> {
  await markAllNotificationsReadAction(userId, notificationIds);
}
