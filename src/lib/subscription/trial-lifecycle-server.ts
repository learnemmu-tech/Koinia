import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churches,
  organizationMemberships,
  organizations,
  subscriptions,
  trialLifecycleEvents,
  users,
} from "@/db/schema";
import { createUserNotifications } from "@/lib/postgres/features";
import { EmailService } from "@/lib/email";
import { emailConfig } from "@/lib/email/config";
import { getTrialEndDate, getTrialLifecycle } from "./trial";

export type TrialLifecycleEventKey =
  | "trial_day_8"
  | "trial_day_10"
  | "trial_day_12"
  | "trial_day_13"
  | "trial_day_14"
  | "trial_expired";

type TrialEvent = {
  key: TrialLifecycleEventKey;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
};
const PROCESSING_TIMEOUT_MS = 60 * 60 * 1000;

function getTrialEvent(
  subscription: typeof subscriptions.$inferSelect,
  now: number,
  legacyTrialStart?: Date
): TrialEvent | null {
  const trialStart =
    subscription.trialStart ??
    (subscription.trialEnd == null ? legacyTrialStart : undefined);
  const trialEnd =
    subscription.trialEnd ??
    (trialStart ? getTrialEndDate(trialStart) : undefined);
  const lifecycle = getTrialLifecycle({
    planId: subscription.planId,
    status: subscription.status,
    trialStart: trialStart?.getTime(),
    trialEnd: trialEnd?.getTime(),
  }, now);
  if (!lifecycle.isTrial || lifecycle.daysIntoTrial == null) return null;

  const days = lifecycle.daysRemaining ?? 0;
  const dayText = days === 1 ? "day" : "days";
  switch (lifecycle.daysIntoTrial) {
    case 8:
      return {
        key: "trial_day_8",
        title: "Your FaithConnectHub trial is halfway through",
        message:
          "Your 14-day FaithConnectHub trial is progressing normally. You have several days remaining to explore your church's features and content. Subscribe before your trial ends to continue uninterrupted access.",
        actionLabel: "View Subscription",
        actionUrl: `${emailConfig.appUrl}/dashboard/billing`,
      };
    case 10:
      return {
        key: "trial_day_10",
        title: "Your FaithConnectHub trial is ending soon",
        message:
          "Your FaithConnectHub trial is approaching its end. Review your plan and subscribe to continue using your church's workspace without interruption.",
        actionLabel: "View Plans",
        actionUrl: `${emailConfig.appUrl}/pricing`,
      };
    case 12:
      return {
        key: "trial_day_12",
        title: "Your FaithConnectHub trial ends soon",
        message: `Your trial has only ${days} ${dayText} remaining. Subscribe now to keep access to your paid features and continue managing your church on FaithConnectHub.`,
        actionLabel: "Start Subscription",
        actionUrl: `${emailConfig.appUrl}/dashboard/billing`,
      };
    case 13:
      return {
        key: "trial_day_13",
        title: "2 days left in your FaithConnectHub trial",
        message:
          "Your free trial ends in 2 days. Subscribe now to continue using FaithConnectHub without interruption.",
        actionLabel: "Start Subscription",
        actionUrl: `${emailConfig.appUrl}/dashboard/billing`,
      };
    case 14:
      return {
        key: "trial_day_14",
        title: "Your FaithConnectHub trial ends today",
        message:
          "Your 14-day trial ends today. Subscribe to continue using FaithConnectHub. Your existing church data remains safe, and restricted access applies after expiration according to your subscription policy.",
        actionLabel: "Start Subscription",
        actionUrl: `${emailConfig.appUrl}/dashboard/billing`,
      };
    default:
      if (lifecycle.phase !== "expired") return null;
      return {
        key: "trial_expired",
        title: "Your FaithConnectHub trial has ended",
        message:
          "Your 14-day trial has ended. Your existing church data remains safe, but trial access has ended and restricted access now applies according to your subscription policy. Subscribe to restore the features available with your selected paid plan.",
        actionLabel: "Choose a Plan",
        actionUrl: `${emailConfig.appUrl}/pricing`,
      };
  }
}

async function claimTrialEvent(
  organizationId: string,
  eventKey: TrialLifecycleEventKey
): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`${organizationId}:${eventKey}`}))`
    );

    const [existing] = await tx
      .select()
      .from(trialLifecycleEvents)
      .where(
        and(
          eq(trialLifecycleEvents.organizationId, organizationId),
          eq(trialLifecycleEvents.eventKey, eventKey)
        )
      )
      .limit(1);

    if (existing?.status === "sent") {
      return false;
    }

    if (
      existing?.status === "processing" &&
      Date.now() - existing.updatedAt.getTime() < PROCESSING_TIMEOUT_MS
    ) {
      return false;
    }

    if (existing) {
      await tx
        .update(trialLifecycleEvents)
        .set({ status: "processing", error: null, updatedAt: new Date() })
        .where(eq(trialLifecycleEvents.id, existing.id));
      return true;
    }

    await tx.insert(trialLifecycleEvents).values({
      organizationId,
      eventKey,
      status: "processing",
    });
    return true;
  });
}

async function finishTrialEvent(
  organizationId: string,
  eventKey: TrialLifecycleEventKey,
  success: boolean,
  error?: string
) {
  await db
    .update(trialLifecycleEvents)
    .set({
      status: success ? "sent" : "failed",
      error: success ? null : error ?? "Trial lifecycle delivery failed",
      sentAt: success ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(trialLifecycleEvents.organizationId, organizationId),
        eq(trialLifecycleEvents.eventKey, eventKey)
      )
    );
}

async function processOrganizationTrialEvent(
  subscription: typeof subscriptions.$inferSelect,
  now: number,
  legacyTrialStart?: Date
): Promise<"sent" | "skipped" | "failed"> {
  const event = getTrialEvent(subscription, now, legacyTrialStart);
  if (
    !event ||
    subscription.planId !== "free" ||
    (subscription.status !== "trialing" && subscription.status !== "active")
  ) {
    return "skipped";
  }
  if (!(await claimTrialEvent(subscription.organizationId, event.key))) {
    return "skipped";
  }

  const [church] = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.organizationId, subscription.organizationId))
    .limit(1);
  const admins = await db
    .select({ id: users.id, email: users.email })
    .from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(
      and(
        eq(organizationMemberships.organizationId, subscription.organizationId),
        eq(organizationMemberships.status, "active"),
        inArray(organizationMemberships.role, ["owner", "org_admin"])
      )
    );
  const emails = [...new Set(admins.map((admin) => admin.email.trim()).filter(Boolean))];

  if (emails.length === 0) {
    await finishTrialEvent(subscription.organizationId, event.key, false, "No active billing administrator email found.");
    return "failed";
  }

  const emailResult = await EmailService.sendTrialLifecycleEmail({
    to: emails,
    title: event.title,
    message: event.message,
    actionLabel: event.actionLabel,
    actionUrl: event.actionUrl,
  });
  if (!emailResult.success) {
    await finishTrialEvent(subscription.organizationId, event.key, false, emailResult.error);
    return "failed";
  }

  if (church) {
    await createUserNotifications({
      userIds: admins.map((admin) => admin.id),
      type: "trial_lifecycle",
      churchId: church.id,
      organizationId: subscription.organizationId,
      title: event.title,
      message: event.message,
      contentTitle: event.key,
    });
  }
  await finishTrialEvent(subscription.organizationId, event.key, true);
  return "sent";
}

export async function processTrialLifecycle(now = Date.now()) {
  const rows = await db
    .select({
      subscription: subscriptions,
      organizationCreatedAt: organizations.createdAt,
    })
    .from(subscriptions)
    .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
    .where(
      and(
        eq(subscriptions.planId, "free"),
        inArray(subscriptions.status, ["trialing", "active"])
      )
    );
  const results = { sent: 0, skipped: 0, failed: 0 };
  for (const subscription of rows) {
    let result: "sent" | "skipped" | "failed";
    try {
      result = await processOrganizationTrialEvent(
        subscription.subscription,
        now,
        subscription.organizationCreatedAt
      );
    } catch (error) {
      console.error(
        "[trial-lifecycle] organization processing failed",
        subscription.subscription.organizationId,
        error
      );
      result = "failed";
    }
    results[result] += 1;
  }
  return { ...results, evaluatedAt: now };
}