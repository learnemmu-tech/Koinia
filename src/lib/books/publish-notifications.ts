import "server-only";

import { createPublishNotifications } from "@/lib/postgres/features";
import type { BookStatus } from "@/types/book";

export async function notifyIfBookNewlyPublished(input: {
  bookId: string;
  title: string;
  coverImageUrl?: string | null;
  churchId: string;
  status: BookStatus;
  previousStatus?: BookStatus;
}): Promise<void> {
  const isNewPublish =
    input.status === "published" && input.previousStatus !== "published";
  if (!isNewPublish) return;

  try {
    await createPublishNotifications({
      type: "book",
      contentId: input.bookId,
      contentTitle: input.title,
      image: input.coverImageUrl ?? undefined,
      churchId: input.churchId,
    });
  } catch (error) {
    console.error("[books] publish notification failed:", error);
  }
}
