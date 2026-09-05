"use server";

import {
  listUserNotifications,
  markAllNotificationsRead as markAllRead,
  markNotificationRead as markRead,
} from "@/lib/postgres/features";
import type { FirebaseNotification } from "@/types/firebase-notification";

export async function fetchUserNotifications(
  userId: string
): Promise<FirebaseNotification[]> {
  return listUserNotifications(userId);
}

export async function markNotificationReadAction(
  userId: string,
  notificationId: string
): Promise<void> {
  await markRead(userId, notificationId);
}

export async function markAllNotificationsReadAction(
  userId: string,
  notificationIds: string[]
): Promise<void> {
  await markAllRead(userId, notificationIds);
}
