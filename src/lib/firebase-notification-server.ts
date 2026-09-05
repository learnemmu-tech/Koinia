import "server-only";

import { createPublishNotifications } from "@/lib/postgres/features";
import type { NotificationContentType } from "@/types/firebase-notification";

export type PublishNotificationInput = {
  type: NotificationContentType;
  contentId: string;
  contentTitle: string;
  image?: string;
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
};

export async function createPublishNotificationServer(
  input: PublishNotificationInput
): Promise<string | null> {
  return createPublishNotifications(input);
}
