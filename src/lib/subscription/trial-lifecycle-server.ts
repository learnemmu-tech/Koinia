import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  organizationMemberships,
  organizations,
  subscriptions,
  trialLifecycleEvents,
  users,
} from "@/db/schema";
import { createUserNotifications } from "@/lib/postgres/features";
import { EmailService } from "@/lib/email";
import { emailConfig } from "@/lib/email/config";
import { ensureSubscriptionDocument } from "@/lib/postgres/tenants";
import { persistLegacyTrialWindows } from "@/lib/subscription/subscription-server";
import {
  getDueTrialLifecycleEventKeys,
  getTrialLifecycle,
  type TrialLifecycleEventKey,
} from "./trial";

export type { TrialLifecycleEventKey };

type TrialEvent = {
  key: TrialLifecycleEventKey;
  title: string;
  message: string;
  emailMessage: string;
  actionLabel: string;
  actionUrl: string;
};

type ChannelStatus = "pending" | "sent" | "failed";

type DeliveryState = {
  v: 2;
  notify: ChannelStatus;
  email: ChannelStatus;
  emails: Record<string, string>;
};

const PROCESSING_TIMEOUT_MS = 60 * 60 * 1000;
const DELIVERY_PREFIX = "delivery:";
const EMAIL_SENT_PREFIX = "email_id:";
const EVENT_KEYS: TrialLifecycleEventKey[] = [
  "trial_day_8",
  "trial_day_10",
  "trial_day_12",
  "trial_day_13",
  "trial_day_14",
  "trial_expired",
];

function billingActionUrl(path: "/dashboard/billing" | "/pricing") {
  return `${emailConfig.appUrl}${path}`;
}

function getTrialEventCopy(key: TrialLifecycleEventKey): TrialEvent {
  switch (key) {
    case "trial_day_8":
      return {
        key,
        title: "Your FaithConnectHub trial is halfway through",
        message:
          "You have 7 days remaining in your free trial. Continue exploring FaithConnectHub and upgrade whenever you're ready.",
        emailMessage:
          "You have 7 days remaining in your free trial. Continue exploring FaithConnectHub and upgrade whenever you're ready.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/dashboard/billing"),
      };
    case "trial_day_10":
      return {
        key,
        title: "Your FaithConnectHub trial ends soon",
        message: "You have 5 days remaining in your free trial.",
        emailMessage:
          "You have 5 days remaining in your free trial. Shepherd AI is available through today. Upgrade whenever you're ready to keep creating and managing your church content.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/pricing"),
      };
    case "trial_day_12":
      return {
        key,
        title: "Your trial ends in 3 days",
        message:
          "Your FaithConnectHub trial ends in 3 days. Upgrade your plan to keep the church workspace active and continue creating, editing, and publishing content.",
        emailMessage:
          "Your FaithConnectHub trial ends in 3 days. Upgrading keeps the church workspace active and allows continued content management.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/dashboard/billing"),
      };
    case "trial_day_13":
      return {
        key,
        title: "Your trial ends in 2 days",
        message: "Your FaithConnectHub trial ends in 2 days.",
        emailMessage:
          "Your FaithConnectHub trial ends in 2 days. Upgrade now so your church can continue managing content without interruption.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/dashboard/billing"),
      };
    case "trial_day_14":
      return {
        key,
        title: "Your FaithConnectHub trial ends today",
        message:
          "Your 14-day free trial ends today. Upgrade your plan to continue creating and managing your church content after the trial.",
        emailMessage:
          "Your 14-day free trial ends today. Upgrade your plan to continue creating and managing your church content after the trial. Existing content remains safe.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/dashboard/billing"),
      };
    case "trial_expired":
      return {
        key,
        title: "Your FaithConnectHub trial has ended",
        message:
          "Your 14-day free trial has ended. Your church is now in read-only mode. Upgrade your plan to continue creating and managing content.",
        emailMessage:
          "Your 14-day free trial has ended. Your church is now in read-only mode. Upgrade your plan to continue creating and managing content.",
        actionLabel: "Upgrade Plan",
        actionUrl: billingActionUrl("/pricing"),
      };
  }
}

function emptyDeliveryState(): DeliveryState {
  return { v: 2, notify: "pending", email: "pending", emails: {} };
}

function parseDeliveryState(error: string | null): DeliveryState {
  if (!error) return emptyDeliveryState();
  if (error.startsWith(DELIVERY_PREFIX)) {
    const json = error.slice(DELIVERY_PREFIX.length).split("\n")[0];
    try {
      const parsed = JSON.parse(json) as {
        notify?: unknown;
        email?: unknown;
        emails?: Record<string, string>;
      };
      const notifyRaw: unknown = parsed.notify;
      const notify =
        notifyRaw === "sent" || notifyRaw === true
          ? "sent"
          : notifyRaw === "failed"
            ? "failed"
            : "pending";
      const email =
        parsed.email === "sent"
          ? "sent"
          : parsed.email === "failed"
            ? "failed"
            : parsed.emails && Object.keys(parsed.emails).length > 0
              ? "pending"
              : "pending";
      return {
        v: 2,
        notify,
        email,
        emails:
          parsed.emails && typeof parsed.emails === "object" ? parsed.emails : {},
      };
    } catch {
      return emptyDeliveryState();
    }
  }
  const match = error.match(new RegExp(`${EMAIL_SENT_PREFIX}([^;\\s]+)`));
  if (match?.[1]) {
    return {
      v: 2,
      notify: error.includes("notify:") ? "failed" : "pending",
      email: "sent",
      emails: { "*": match[1] },
    };
  }
  return emptyDeliveryState();
}

function serializeDeliveryState(state: DeliveryState, error?: string | null) {
  const payload = `${DELIVERY_PREFIX}${JSON.stringify(state)}`;
  return error ? `${payload}\n${error}` : payload;
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
        .set({ status: "processing", updatedAt: new Date() })
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

async function saveDeliveryProgress(
  organizationId: string,
  eventKey: TrialLifecycleEventKey,
  delivery: DeliveryState,
  error?: string | null
) {
  await db
    .update(trialLifecycleEvents)
    .set({
      status: "processing",
      error: serializeDeliveryState(delivery, error),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(trialLifecycleEvents.organizationId, organizationId),
        eq(trialLifecycleEvents.eventKey, eventKey)
      )
    );
}

async function finishTrialEvent(
  organizationId: string,
  eventKey: TrialLifecycleEventKey,
  success: boolean,
  delivery: DeliveryState,
  error?: string | null
) {
  await db
    .update(trialLifecycleEvents)
    .set({
      status: success ? "sent" : "failed",
      error: serializeDeliveryState(delivery, success ? null : error),
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

async function loadExistingEventError(
  organizationId: string,
  eventKey: TrialLifecycleEventKey
): Promise<string | null> {
  const [existing] = await db
    .select({ error: trialLifecycleEvents.error })
    .from(trialLifecycleEvents)
    .where(
      and(
        eq(trialLifecycleEvents.organizationId, organizationId),
        eq(trialLifecycleEvents.eventKey, eventKey)
      )
    )
    .limit(1);
  return existing?.error ?? null;
}

function emailsAlreadyAccepted(state: DeliveryState): boolean {
  return Boolean(state.emails["*"]);
}

type LifecycleRecipient = {
  userId: string;
  email: string;
  role: "owner" | "org_admin";
};

async function resolveTrialLifecycleRecipients(
  organizationId: string
): Promise<LifecycleRecipient[]> {
  const [org] = await db
    .select({
      ownerId: organizations.ownerId,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  const members = await db
    .select({
      userId: users.id,
      email: users.email,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "active"),
        inArray(organizationMemberships.role, ["owner", "org_admin"])
      )
    );

  const byUser = new Map<string, LifecycleRecipient>();
  for (const row of members) {
    const email = row.email.trim();
    if (!email) continue;
    byUser.set(row.userId, {
      userId: row.userId,
      email,
      role: row.role === "owner" ? "owner" : "org_admin",
    });
  }

  if (org?.ownerId && !byUser.has(org.ownerId)) {
    const [owner] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, org.ownerId))
      .limit(1);
    const email = owner?.email.trim() ?? "";
    if (owner && email) {
      byUser.set(owner.id, {
        userId: owner.id,
        email,
        role: "owner",
      });
    }
  }

  return [...byUser.values()];
}

async function notificationAlreadySent(
  organizationId: string,
  event: TrialEvent,
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await db
    .select({ userId: notifications.userId })
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.type, "trial_lifecycle"),
        inArray(notifications.userId, userIds),
        or(
          eq(notifications.title, event.title),
          eq(notifications.contentTitle, event.key),
          eq(notifications.contentTitle, event.title)
        )
      )
    );
  return new Set(rows.map((row) => row.userId));
}

async function processOrganizationTrialEvent(
  subscription: typeof subscriptions.$inferSelect,
  event: TrialEvent,
  now: number
): Promise<"sent" | "skipped" | "failed"> {
  if (!(await claimTrialEvent(subscription.organizationId, event.key))) {
    return "skipped";
  }

  const delivery = parseDeliveryState(
    await loadExistingEventError(subscription.organizationId, event.key)
  );

  const recipients = await resolveTrialLifecycleRecipients(
    subscription.organizationId
  );
  const emails = [...new Set(recipients.map((row) => row.email))];

  console.info("[trial-lifecycle] processing", {
    organizationId: subscription.organizationId,
    eventKey: event.key,
    recipientCount: recipients.length,
    churchId: null,
    evaluatedAt: now,
    recipients: recipients.map((row) => ({
      userId: row.userId,
      role: row.role,
      email: row.email,
    })),
  });

  if (recipients.length === 0) {
    delivery.notify = "failed";
    delivery.email = "failed";
    await finishTrialEvent(
      subscription.organizationId,
      event.key,
      false,
      delivery,
      "No active owner or organization admin found."
    );
    return "failed";
  }

  const alreadyNotified = await notificationAlreadySent(
    subscription.organizationId,
    event,
    recipients.map((row) => row.userId)
  );
  const pendingNotifyUserIds = recipients
    .map((row) => row.userId)
    .filter((userId) => !alreadyNotified.has(userId));

  if (pendingNotifyUserIds.length === 0) {
    delivery.notify = "sent";
  } else {
    try {
      await createUserNotifications({
        userIds: pendingNotifyUserIds,
        type: "trial_lifecycle",
        churchId: null,
        organizationId: subscription.organizationId,
        title: event.title,
        message: event.message,
        contentTitle: event.title,
      });
      delivery.notify = "sent";
      await saveDeliveryProgress(
        subscription.organizationId,
        event.key,
        delivery
      );
      console.info("[trial-lifecycle] in-app notification created", {
        organizationId: subscription.organizationId,
        eventKey: event.key,
        channel: "in-app",
        result: "sent",
        recipientCount: pendingNotifyUserIds.length,
        recipientUserIds: pendingNotifyUserIds,
      });
    } catch (error) {
      delivery.notify = "failed";
      console.error("[trial-lifecycle] in-app notification failed", {
        organizationId: subscription.organizationId,
        eventKey: event.key,
        channel: "in-app",
        result: "failed",
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  let emailError: string | null = null;
  if (emails.length === 0) {
    delivery.email = "failed";
    emailError = "No billing administrator email addresses found.";
  } else if (!emailsAlreadyAccepted(delivery) && delivery.email !== "sent") {
    for (const recipient of recipients) {
      if (delivery.emails[recipient.email]) {
        console.info("[trial-lifecycle] email skipped", {
          organizationId: subscription.organizationId,
          eventKey: event.key,
          channel: "email",
          recipientUserId: recipient.userId,
          recipientRole: recipient.role,
          recipientEmail: recipient.email,
          preferenceDecision: "transactional_always_send",
          result: "already_accepted",
          id: delivery.emails[recipient.email],
        });
        continue;
      }
      const emailResult = await EmailService.sendTrialLifecycleEmail({
        to: recipient.email,
        title: event.title,
        message: event.emailMessage,
        actionLabel: event.actionLabel,
        actionUrl: event.actionUrl,
      });
      console.info("[trial-lifecycle] email dispatch", {
        organizationId: subscription.organizationId,
        eventKey: event.key,
        channel: "email",
        recipientUserId: recipient.userId,
        recipientRole: recipient.role,
        recipientEmail: recipient.email,
        preferenceDecision: "transactional_always_send",
        result: emailResult.success ? "accepted" : "failed",
        id: emailResult.id ?? null,
        error: emailResult.error ?? null,
      });
      if (!emailResult.success) {
        emailError = emailResult.error ?? "send failed";
        delivery.email = "failed";
        continue;
      }
      delivery.emails[recipient.email] = emailResult.id ?? "accepted";
      await saveDeliveryProgress(
        subscription.organizationId,
        event.key,
        delivery
      );
    }
  }

  const emailsComplete =
    emailsAlreadyAccepted(delivery) ||
    (emails.length > 0 && emails.every((email) => Boolean(delivery.emails[email])));
  if (emailsComplete) {
    delivery.email = "sent";
  } else if (delivery.email !== "failed") {
    delivery.email = "failed";
  }

  if (delivery.notify !== "sent" || delivery.email !== "sent") {
    await finishTrialEvent(
      subscription.organizationId,
      event.key,
      false,
      delivery,
      [
        delivery.notify !== "sent" ? "notify: in-app notification failed" : null,
        delivery.email !== "sent" ? `email: ${emailError ?? "incomplete"}` : null,
      ]
        .filter(Boolean)
        .join("; ")
    );
    return "failed";
  }

  await finishTrialEvent(
    subscription.organizationId,
    event.key,
    true,
    delivery
  );
  return "sent";
}

async function repairMissingTrialLifecycleNotifications(): Promise<number> {
  const rows = await db
    .select({
      organizationId: trialLifecycleEvents.organizationId,
      eventKey: trialLifecycleEvents.eventKey,
    })
    .from(trialLifecycleEvents)
    .where(eq(trialLifecycleEvents.status, "sent"));

  let repaired = 0;
  for (const row of rows) {
    if (!EVENT_KEYS.includes(row.eventKey as TrialLifecycleEventKey)) continue;
    const event = getTrialEventCopy(row.eventKey as TrialLifecycleEventKey);
    const recipients = await resolveTrialLifecycleRecipients(row.organizationId);
    if (recipients.length === 0) continue;
    const alreadyNotified = await notificationAlreadySent(
      row.organizationId,
      event,
      recipients.map((item) => item.userId)
    );
    const pending = recipients
      .map((item) => item.userId)
      .filter((userId) => !alreadyNotified.has(userId));
    if (pending.length === 0) continue;

    await createUserNotifications({
      userIds: pending,
      type: "trial_lifecycle",
      churchId: null,
      organizationId: row.organizationId,
      title: event.title,
      message: event.message,
      contentTitle: event.title,
    });
    repaired += pending.length;
    console.info("[trial-lifecycle] repaired missing in-app notification", {
      organizationId: row.organizationId,
      eventKey: event.key,
      recipientCount: pending.length,
    });
  }
  return repaired;
}

export type TrialLifecycleProcessResult = {
  sent: number;
  skipped: number;
  failed: number;
  evaluated: number;
  paidSkipped: number;
  backfilled: number;
  notificationsRepaired: number;
  evaluatedAt: number;
  organizations: Array<{
    organizationId: string;
    entitlement: "paid" | "trial" | "expired" | "unknown";
    skipReason?: string;
    events: Array<{
      eventKey: TrialLifecycleEventKey;
      result: "sent" | "skipped" | "failed";
    }>;
  }>;
};

export async function processTrialLifecycle(
  now = Date.now()
): Promise<TrialLifecycleProcessResult> {
  const backfilled = await persistLegacyTrialWindows();
  const notificationsRepaired = await repairMissingTrialLifecycleNotifications();

  const rows = await db
    .select({
      organizationId: organizations.id,
      organizationCreatedAt: organizations.createdAt,
      subscription: subscriptions,
    })
    .from(organizations)
    .leftJoin(
      subscriptions,
      eq(organizations.id, subscriptions.organizationId)
    );

  const results: TrialLifecycleProcessResult = {
    sent: 0,
    skipped: 0,
    failed: 0,
    evaluated: 0,
    paidSkipped: 0,
    backfilled,
    notificationsRepaired,
    evaluatedAt: now,
    organizations: [],
  };

  for (const row of rows) {
    results.evaluated += 1;
    let subscription = row.subscription;
    if (!subscription) {
      subscription = await ensureSubscriptionDocument(row.organizationId);
    }
    if (!subscription) {
      results.skipped += 1;
      results.organizations.push({
        organizationId: row.organizationId,
        entitlement: "unknown",
        skipReason: "no_subscription",
        events: [],
      });
      continue;
    }

    const lifecycle = getTrialLifecycle(
      {
        planId: subscription.planId,
        status: subscription.status,
        trialStart: subscription.trialStart?.getTime(),
        trialEnd: subscription.trialEnd?.getTime(),
        currentPeriodEnd: subscription.currentPeriodEnd?.getTime(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      now,
      row.organizationCreatedAt
    );

    if (lifecycle.access === "paid") {
      results.paidSkipped += 1;
      results.organizations.push({
        organizationId: row.organizationId,
        entitlement: "paid",
        skipReason: "paid_entitlement",
        events: [],
      });
      continue;
    }

    const events = getDueTrialLifecycleEventKeys(lifecycle).map(getTrialEventCopy);
    if (events.length === 0) {
      results.skipped += 1;
      results.organizations.push({
        organizationId: row.organizationId,
        entitlement: lifecycle.access,
        skipReason: "no_due_events",
        events: [],
      });
      continue;
    }

    const eventResults: TrialLifecycleProcessResult["organizations"][number]["events"] =
      [];
    for (const event of events) {
      let result: "sent" | "skipped" | "failed";
      try {
        result = await processOrganizationTrialEvent(
          subscription,
          event,
          now
        );
      } catch (error) {
        console.error("[trial-lifecycle] organization processing failed", {
          organizationId: row.organizationId,
          eventKey: event.key,
          error: error instanceof Error ? error.message : "unknown",
        });
        result = "failed";
      }
      results[result] += 1;
      eventResults.push({ eventKey: event.key, result });
    }
    results.organizations.push({
      organizationId: row.organizationId,
      entitlement: lifecycle.access,
      events: eventResults,
    });
  }

  return results;
}
