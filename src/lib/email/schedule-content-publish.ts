import "server-only";

import {
  triggerContentAnnouncementEmails,
  triggerEventAnnouncementEmails,
  type ContentPublishEmailType,
} from "@/lib/email/triggers";
import {
  createPublishNotifications,
  getArticleById,
  getEventById,
  getSermonById,
  getSongById,
} from "@/lib/postgres/features";

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

function collectionToNotificationType(
  collection: ContentCollection
): "song" | "sermon" | "article" | "event" {
  switch (collection) {
    case "songs":
      return "song";
    case "sermons":
      return "sermon";
    case "articles":
      return "article";
    case "events":
      return "event";
  }
}

async function dispatchChurchContentPublishInApp(input: {
  collection: ContentCollection;
  contentId: string;
}): Promise<void> {
  const contentId = input.contentId.trim();
  if (!contentId) return;

  try {
    let churchId = "";
    let contentTitle = "";
    let image: string | undefined;

    switch (input.collection) {
      case "songs": {
        const song = await getSongById(contentId);
        churchId = song?.churchId ?? "";
        contentTitle = song?.songTitle?.trim() || song?.title?.trim() || "";
        image = song?.imageUrl;
        break;
      }
      case "sermons": {
        const sermon = await getSermonById(contentId);
        churchId = sermon?.churchId ?? "";
        contentTitle = sermon?.title?.trim() || "";
        image = sermon?.coverImage;
        break;
      }
      case "articles": {
        const article = await getArticleById(contentId);
        churchId = article?.churchId ?? "";
        contentTitle = article?.title?.trim() || "";
        image = article?.coverImage;
        break;
      }
      case "events": {
        const event = await getEventById(contentId);
        churchId = event?.churchId ?? "";
        contentTitle = event?.title?.trim() || "";
        image = event?.bannerImage;
        break;
      }
    }

    if (!churchId || !contentTitle) {
      console.error("[notifications] content publish in-app skipped", {
        collection: input.collection,
        contentId,
        reason: !churchId ? "missing-church" : "missing-title",
      });
      return;
    }

    const notificationId = await createPublishNotifications({
      type: collectionToNotificationType(input.collection),
      contentId,
      contentTitle,
      image,
      churchId,
    });
    console.info("[notifications] content publish in-app", {
      collection: input.collection,
      contentId,
      churchId,
      notificationId,
    });
  } catch (error) {
    console.error("[notifications] content publish in-app failed", {
      collection: input.collection,
      contentId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

/**
 * In-app + email fan-out after content is saved. Awaited so Vercel does not
 * freeze the isolate before delivery work starts. Failures never throw.
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

  await dispatchChurchContentPublishInApp({
    collection: input.collection,
    contentId: input.contentId,
  });

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
