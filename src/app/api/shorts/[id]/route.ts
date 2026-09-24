import { NextResponse } from "next/server";

import { triggerShortPublishedEmails, triggerShortPendingReviewNotifications, triggerShortReviewResultNotification } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  deleteShort,
  getShortForViewer,
  incrementShortViewCount,
  moderateShort,
  publishShort,
  updateShortMetadata,
  updateShortThumbnailUrl,
} from "@/lib/postgres/shorts";
import { isSubscriptionLimitError } from "@/lib/subscription/subscription-server";
import {
  SHORT_CATEGORIES,
  type ShortCategory,
  type ShortVisibility,
} from "@/types/video-short";

type RouteContext = { params: Promise<{ id: string }> };

function parseCategory(value: unknown): ShortCategory | undefined {
  if (typeof value === "string" && SHORT_CATEGORIES.includes(value as ShortCategory)) {
    return value as ShortCategory;
  }
  return undefined;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const verified = await verifyBearerToken(request).catch(() => null);

  const short = await getShortForViewer(
    id,
    verified?.uid ?? null,
    verified?.email
  );
  if (!short) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  void incrementShortViewCount(id);
  return NextResponse.json(short);
}

export async function PATCH(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.action === "approve" || body.action === "reject") {
      const updated = await moderateShort({
        shortId: id,
        clerkId: verified.uid,
        email: verified.email,
        action: body.action,
      });
      if (updated.churchId && updated.organizationId && updated.userId) {
        try {
          await triggerShortReviewResultNotification({
            shortId: updated.id,
            churchId: updated.churchId,
            organizationId: updated.organizationId,
            submitterUserId: updated.userId,
            approved: body.action === "approve",
            caption: updated.caption,
          });
        } catch (error) {
          console.error("[shorts/review] member notify failed", error);
        }
      }
      if (body.action === "approve") {
        try {
          await triggerShortPublishedEmails(updated.id, verified.uid);
        } catch (error) {
          console.error("[shorts/review] email dispatch failed", error);
        }
      }
      return NextResponse.json({
        id: updated.id,
        moderationStatus: updated.moderationStatus,
        publishedAt: updated.publishedAt,
      });
    }

    if (typeof body.videoUrl === "string" && body.videoUrl.trim()) {
      const updated = await publishShort({
        shortId: id,
        clerkId: verified.uid,
        email: verified.email,
        videoUrl: body.videoUrl.trim(),
        thumbnailUrl:
          typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : null,
        duration:
          typeof body.duration === "number" ? Math.round(body.duration) : null,
        caption: typeof body.caption === "string" ? body.caption : undefined,
        category: parseCategory(body.category),
        visibility:
          body.visibility === "public" || body.visibility === "church"
            ? (body.visibility as ShortVisibility)
            : undefined,
      });
      if (updated.submittedForReview && updated.churchId && updated.organizationId) {
        try {
          await triggerShortPendingReviewNotifications({
            shortId: updated.id,
            churchId: updated.churchId,
            organizationId: updated.organizationId,
            submitterUserId: updated.userId,
            caption: updated.caption,
          });
        } catch (error) {
          console.error("[shorts/submit] admin notify failed", error);
        }
      }
      if (updated.isFirstPublish) {
        try {
          await triggerShortPublishedEmails(updated.id, verified.uid);
        } catch (error) {
          console.error("[shorts/publish] email dispatch failed", error);
        }
      }
      return NextResponse.json({
        id: updated.id,
        publishedAt: updated.publishedAt,
        moderationStatus: updated.moderationStatus,
        submittedForReview: updated.submittedForReview,
      });
    }

    if ("thumbnailUrl" in body) {
      const updated = await updateShortThumbnailUrl({
        shortId: id,
        clerkId: verified.uid,
        email: verified.email,
        thumbnailUrl:
          typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : null,
      });
      return NextResponse.json({
        id: updated.id,
        thumbnailUrl: updated.thumbnailUrl,
      });
    }

    const updated = await updateShortMetadata({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
      caption: typeof body.caption === "string" ? body.caption : undefined,
      category: parseCategory(body.category),
      visibility:
        body.visibility === "public" || body.visibility === "church"
          ? (body.visibility as ShortVisibility)
          : undefined,
    });
    return NextResponse.json({ id: updated.id });
  } catch (error) {
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/shorts PATCH]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (raw === "Short not found") {
      return NextResponse.json({ error: "Short not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(_request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await deleteShort({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/shorts DELETE]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (raw === "Short not found") {
      return NextResponse.json({ error: "Short not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
