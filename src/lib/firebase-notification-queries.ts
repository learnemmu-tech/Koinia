import type {
  FirebaseNotification,
  NotificationContentType,
} from "@/types/firebase-notification";

import { firebaseAuth } from "@/lib/firebase-auth-service";
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
  notification: Pick<FirebaseNotification, "type" | "contentId">
): string {
  if (notification.type === "prayer_request_submitted") {
    return "/dashboard/content?tab=prayers";
  }
  if (notification.type === "membership_approved") {
    return "/dashboard";
  }
  const preset = NOTIFICATION_PRESETS[notification.type] ?? NOTIFICATION_PRESETS.song;
  return `${preset.pathPrefix}/${encodeURIComponent(notification.contentId)}`;
}

export function getNotificationTypeLabel(type: NotificationContentType): string {
  return (NOTIFICATION_PRESETS[type] ?? NOTIFICATION_PRESETS.song).title;
}

export function subscribeToNotifications(
  userId: string,
  onChange: (notifications: FirebaseNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  let cancelled = false;

  const tick = async () => {
    try {
      const items = await fetchUserNotifications(userId);
      if (!cancelled) onChange(items);
    } catch (error) {
      if (!cancelled) onError?.(error instanceof Error ? error : new Error("Failed to load notifications"));
    }
  };

  void tick();
  const interval = setInterval(() => {
    void tick();
  }, 60_000);

  return () => {
    cancelled = true;
    clearInterval(interval);
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
