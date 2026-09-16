import "server-only";

import {
  triggerContentAnnouncementEmails,
  triggerEventAnnouncementEmails,
  type ContentPublishEmailType,
} from "@/lib/email/triggers";

type ContentCollection = "songs" | "sermons" | "articles" | "events";

type PublishableRecord = {
  published?: boolean;
  isPublished?: boolean;
  status?: string;
};

export function isStoredContentPublished(
  collection: ContentCollection,
  record: PublishableRecord | null | undefined
): boolean {
  if (!record) return false;
  switch (collection) {
    case "songs":
      return record.published !== false;
    case "sermons":
    case "articles":
      return record.isPublished === true;
    case "events":
      return record.status === "published";
  }
}

export function willUpdatePublishContent(
  collection: ContentCollection,
  data: Record<string, unknown>,
  existing: PublishableRecord | null
): boolean {
  const wasPublished = isStoredContentPublished(collection, existing);
  if (wasPublished) return false;

  switch (collection) {
    case "songs":
      if (data.published === undefined) return false;
      return data.published !== false;
    case "sermons":
    case "articles":
      if (data.isPublished === undefined) return false;
      return data.isPublished === true;
    case "events":
      if (data.status === undefined) return false;
      return data.status === "published";
  }
}

function collectionToEmailType(
  collection: Exclude<ContentCollection, "events">
): ContentPublishEmailType {
  switch (collection) {
    case "songs":
      return "song";
    case "sermons":
      return "sermon";
    case "articles":
      return "article";
  }
}

/**
 * Email is secondary to saving content. Awaited in the content route so delivery
 * is not dropped when the client token expires after a long upload, and not
 * killed by returning from a serverless handler before the send completes.
 * Failures never throw.
 */
export async function dispatchChurchContentPublishEmails(input: {
  collection: ContentCollection;
  contentId: string;
  isNewlyPublished: boolean;
  excludeClerkId?: string;
}): Promise<void> {
  if (!input.isNewlyPublished || !input.contentId.trim()) {
    return;
  }

  try {
    if (input.collection === "events") {
      await triggerEventAnnouncementEmails(
        input.contentId,
        input.excludeClerkId
      );
    } else {
      await triggerContentAnnouncementEmails(
        collectionToEmailType(input.collection),
        input.contentId,
        input.excludeClerkId
      );
    }
  } catch (error) {
    console.error("[email] content publish dispatch failed", {
      collection: input.collection,
      contentId: input.contentId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
