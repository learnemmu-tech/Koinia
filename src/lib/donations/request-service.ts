import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  churchMemberships,
  donationRequestEvents,
  donationRequests,
  notifications,
  organizationMemberships,
  users,
} from "@/db/schema";
import { DonationRequestNoticeEmail } from "@/emails/templates/donation-request-notice";
import { sendEmail } from "@/lib/email/send-email";
import { resolveAppOrigin } from "@/lib/join-url";
import {
  canTransitionDonationRequest,
  isDonationRequestCategory,
  parseRequestedAmount,
  type DonationRequestStatus,
} from "@/lib/donations/request-rules";

async function churchAdmins(organizationId: string, churchId: string) {
  const churchAdmins = await db
    .select({ id: users.id, email: users.email })
    .from(churchMemberships)
    .innerJoin(users, eq(users.id, churchMemberships.userId))
    .where(
      and(
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active"),
        eq(churchMemberships.role, "church_admin")
      )
    );
  const orgAdmins = await db
    .select({ id: users.id, email: users.email })
    .from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "active"),
        inArray(organizationMemberships.role, ["owner", "org_admin"])
      )
    );
  const seen = new Set<string>();
  return [...churchAdmins, ...orgAdmins].filter((person) => {
    if (seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  });
}

async function notifyUsers(input: {
  organizationId: string;
  churchId: string;
  userIds: string[];
  type: "donation_request_submitted" | "donation_request_decision";
  title: string;
  message: string;
  contentId: string;
}) {
  if (input.userIds.length === 0) return;
  await db.insert(notifications).values(
    input.userIds.map((userId) => ({
      organizationId: input.organizationId,
      churchId: input.churchId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      contentTitle: "",
      contentId: input.contentId,
    }))
  );
}

async function emailSafe(to: string, subject: string, body: string, path: string) {
  try {
    await sendEmail({
      to,
      subject,
      react: DonationRequestNoticeEmail({
        heading: subject,
        body,
        actionUrl: `${resolveAppOrigin()}${path}`,
      }),
    });
  } catch (error) {
    console.error("[donation-request] email failed", error);
  }
}

export async function memberChurchContext(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      churchId: users.activeChurchId,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.churchId || !user.organizationId) return null;
  const [membership] = await db
    .select({ role: churchMemberships.role, status: churchMemberships.status })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, userId),
        eq(churchMemberships.churchId, user.churchId),
        eq(churchMemberships.organizationId, user.organizationId),
        eq(churchMemberships.status, "active")
      )
    )
    .limit(1);
  if (!membership) return null;
  return { ...user, churchId: user.churchId, role: membership.role };
}

export async function submitDonationRequest(input: {
  userId: string;
  title: string;
  category: string;
  reason: string;
  amount: string;
  additionalInformation: string;
  acknowledged: boolean;
  idempotencyKey: string;
}) {
  if (!input.acknowledged) return { ok: false as const, error: "Acknowledge the privacy notice." };
  const title = input.title.trim();
  const reason = input.reason.trim();
  if (title.length < 3 || title.length > 120) return { ok: false as const, error: "Title must be 3–120 characters." };
  if (reason.length < 20 || reason.length > 4000) {
    return { ok: false as const, error: "Explain the need in 20–4000 characters." };
  }
  if (!isDonationRequestCategory(input.category)) return { ok: false as const, error: "Choose a category." };
  const amount = parseRequestedAmount(input.amount);
  if (!amount.ok) return amount;
  if (!/^[0-9a-f-]{16,80}$/i.test(input.idempotencyKey)) {
    return { ok: false as const, error: "Invalid submission." };
  }
  const member = await memberChurchContext(input.userId);
  if (!member) return { ok: false as const, error: "An active church membership is required." };

  const existing = await db
    .select({ id: donationRequests.id })
    .from(donationRequests)
    .where(eq(donationRequests.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing[0]) return { ok: true as const, id: existing[0].id, duplicate: true };

  const [created] = await db
    .insert(donationRequests)
    .values({
      organizationId: member.organizationId!,
      churchId: member.churchId,
      memberId: member.id,
      title,
      category: input.category,
      reason,
      amount: amount.amount,
      additionalInformation: input.additionalInformation.trim().slice(0, 2000),
      status: "submitted",
      acknowledged: true,
      idempotencyKey: input.idempotencyKey,
    })
    .returning({ id: donationRequests.id });
  if (!created) return { ok: false as const, error: "Could not save the request." };

  await db.insert(donationRequestEvents).values({
    requestId: created.id,
    actorUserId: member.id,
    action: "submitted",
  });

  const admins = await churchAdmins(member.organizationId!, member.churchId);
  const message = "A member has submitted a donation request that requires your review.";
  await notifyUsers({
    organizationId: member.organizationId!,
    churchId: member.churchId,
    userIds: admins.map((admin) => admin.id),
    type: "donation_request_submitted",
    title: "New Donation Request",
    message,
    contentId: created.id,
  });
  const path = `/dashboard/content?tab=donations&section=requests&request=${created.id}`;
  for (const admin of admins) {
    await emailSafe(admin.email, "New Donation Request — Koinia", "A new donation request has been submitted for your church. Please sign in to Koinia to review the request.", path);
  }
  return { ok: true as const, id: created.id, duplicate: false };
}

export async function listOwnDonationRequests(userId: string) {
  return db
    .select({
      id: donationRequests.id,
      title: donationRequests.title,
      category: donationRequests.category,
      amount: donationRequests.amount,
      currency: donationRequests.currency,
      status: donationRequests.status,
      memberResponse: donationRequests.memberResponse,
      createdAt: donationRequests.createdAt,
      updatedAt: donationRequests.updatedAt,
    })
    .from(donationRequests)
    .where(eq(donationRequests.memberId, userId))
    .orderBy(desc(donationRequests.createdAt));
}

export async function isChurchDonationAdmin(userId: string, churchId: string, organizationId: string) {
  const [church] = await db
    .select({ id: churchMemberships.id })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, userId),
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active"),
        eq(churchMemberships.role, "church_admin")
      )
    )
    .limit(1);
  if (church) return true;
  const [org] = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "active"),
        inArray(organizationMemberships.role, ["owner", "org_admin"])
      )
    )
    .limit(1);
  return Boolean(org);
}

export async function listChurchDonationRequests(userId: string) {
  const context = await memberChurchContext(userId);
  if (!context || !(await isChurchDonationAdmin(userId, context.churchId, context.organizationId!))) {
    return [];
  }
  return db
    .select({
      id: donationRequests.id,
      title: donationRequests.title,
      category: donationRequests.category,
      amount: donationRequests.amount,
      currency: donationRequests.currency,
      status: donationRequests.status,
      reason: donationRequests.reason,
      additionalInformation: donationRequests.additionalInformation,
      memberResponse: donationRequests.memberResponse,
      createdAt: donationRequests.createdAt,
      memberId: donationRequests.memberId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(donationRequests)
    .innerJoin(users, eq(users.id, donationRequests.memberId))
    .where(
      and(
        eq(donationRequests.churchId, context.churchId),
        eq(donationRequests.organizationId, context.organizationId!)
      )
    )
    .orderBy(desc(donationRequests.createdAt));
}

export async function listDonationRequestReviewHistory(userId: string, requestId: string) {
  const context = await memberChurchContext(userId);
  if (!context || !(await isChurchDonationAdmin(userId, context.churchId, context.organizationId!))) {
    return [];
  }
  const [owned] = await db
    .select({ id: donationRequests.id })
    .from(donationRequests)
    .where(
      and(
        eq(donationRequests.id, requestId),
        eq(donationRequests.churchId, context.churchId),
        eq(donationRequests.organizationId, context.organizationId!)
      )
    )
    .limit(1);
  if (!owned) return [];
  return db
    .select({
      id: donationRequestEvents.id,
      action: donationRequestEvents.action,
      note: donationRequestEvents.note,
      createdAt: donationRequestEvents.createdAt,
    })
    .from(donationRequestEvents)
    .where(eq(donationRequestEvents.requestId, requestId))
    .orderBy(desc(donationRequestEvents.createdAt));
}

export async function decideDonationRequest(input: {
  actorId: string;
  requestId: string;
  decision: "approved" | "rejected" | "under_review";
  memberResponse: string;
}) {
  const context = await memberChurchContext(input.actorId);
  if (!context || !(await isChurchDonationAdmin(input.actorId, context.churchId, context.organizationId!))) {
    return { ok: false as const, error: "You cannot review donation requests." };
  }
  const [current] = await db
    .select()
    .from(donationRequests)
    .where(
      and(
        eq(donationRequests.id, input.requestId),
        eq(donationRequests.churchId, context.churchId),
        eq(donationRequests.organizationId, context.organizationId!)
      )
    )
    .limit(1);
  if (!current) return { ok: false as const, error: "Request not found." };
  if (current.memberId === input.actorId) {
    return { ok: false as const, error: "You cannot review your own request." };
  }
  const from = current.status as DonationRequestStatus;
  if (!canTransitionDonationRequest(from, input.decision)) {
    return { ok: false as const, error: "That status change is not allowed." };
  }
  const response = input.memberResponse.trim().slice(0, 2000);
  const updated = await db
    .update(donationRequests)
    .set({
      status: input.decision,
      memberResponse: input.decision === "under_review" ? current.memberResponse : response,
      reviewerId: input.actorId,
      reviewedAt: input.decision === "under_review" ? current.reviewedAt : new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(donationRequests.id, current.id), eq(donationRequests.status, from)))
    .returning({ id: donationRequests.id });
  if (!updated[0]) return { ok: false as const, error: "This request was already updated." };

  await db.insert(donationRequestEvents).values({
    requestId: current.id,
    actorUserId: input.actorId,
    action: input.decision,
    note: input.decision === "under_review" ? "" : response,
  });

  if (input.decision === "under_review") return { ok: true as const };

  const [member] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, current.memberId))
    .limit(1);
  const approved = input.decision === "approved";
  const title = approved ? "Your Donation Request Has Been Approved" : "Update on Your Donation Request";
  const message = approved
    ? "Your donation request has been reviewed and approved by your church administrator. The church may now consider creating a separate donation campaign. Approval does not mean that a campaign has already been published."
    : "Your donation request has been reviewed by your church administrator. Unfortunately, the request has not been approved. Please review the administrator's response for further information.";
  await notifyUsers({
    organizationId: context.organizationId!,
    churchId: context.churchId,
    userIds: [current.memberId],
    type: "donation_request_decision",
    title,
    message,
    contentId: current.id,
  });
  if (member?.email) {
    await emailSafe(
      member.email,
      title,
      response ? `${message} Response: ${response}` : message,
      "/donations/requests"
    );
  }
  return { ok: true as const };
}
