import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import type {
  FirebaseNotification,
  NotificationContentType,
} from "@/types/firebase-notification";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import { db } from "@/lib/firebase";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Central per-type presets. Adding a new channel (e.g. email) later only needs
 * to read these same values, so content stays consistent across channels.
 */
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

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { toMillis(): number }).toMillis === "function"
  ) {
    return (value as { toMillis(): number }).toMillis();
  }
  if (typeof value === "number") return value;
  return Date.now();
}

function normalizeNotification(
  id: string,
  data: Record<string, unknown>
): FirebaseNotification {
  const type = (data.type as NotificationContentType) ?? "song";
  const preset = NOTIFICATION_PRESETS[type] ?? NOTIFICATION_PRESETS.song;

  return {
    id,
    type,
    userId: String(data.userId ?? ""),
    churchId: String(data.churchId ?? ""),
    title: String(data.title ?? preset.title),
    message: String(data.message ?? preset.message),
    // Fall back to legacy `title` field for notifications created before
    // `contentTitle` existed.
    contentTitle: String(data.contentTitle ?? data.title ?? ""),
    image: String(data.image ?? "") || undefined,
    contentId: String(data.contentId ?? ""),
    read: data.read === true,
    createdAt: toMillis(data.createdAt),
  };
}

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

/**
 * Creates in-app notification documents for newly published content.
 * Uses Admin SDK via API so church admins are not blocked by branchMembership rules.
 */
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
    console.warn("[notifications] skipped — missing contentId or contentTitle", input);
    return null;
  }

  const churchId = input.churchId?.trim();
  if (!churchId) {
    console.warn("[notifications] skipped — churchId is required", input);
    return null;
  }

  try {
    const notificationId = await createPublishNotificationViaApi(input);
    if (notificationId) {
      console.info(
        `[notifications] created notification(s) (${input.type}: ${input.contentTitle.trim()})`
      );
    }
    return notificationId;
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
): Unsubscribe {
  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((docSnap) =>
          normalizeNotification(docSnap.id, docSnap.data() as Record<string, unknown>)
        )
      );
    },
    (error) => {
      console.error("[subscribeToNotifications]", error);
      onError?.(error);
    }
  );
}

export function subscribeToReadNotificationIds(
  userId: string,
  onChange: (readIds: Set<string>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const readsQuery = query(
    collection(db, "users", userId, "notificationReads")
  );

  return onSnapshot(
    readsQuery,
    (snapshot) => {
      onChange(new Set(snapshot.docs.map((docSnap) => docSnap.id)));
    },
    (error) => {
      console.error("[subscribeToReadNotificationIds]", error);
      onError?.(error);
    }
  );
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", userId, "notificationReads", notificationId),
      { readAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error("[notifications] failed to mark read", error);
  }
}

export async function markAllNotificationsRead(
  userId: string,
  notificationIds: string[]
): Promise<void> {
  await Promise.all(
    notificationIds.map((notificationId) =>
      markNotificationRead(userId, notificationId)
    )
  );
}
