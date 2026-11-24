import "server-only";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";

import { db } from "@/db";
import {
  churchDonationMethods,
  churchDonationProfiles,
  donationCampaignMethods,
  donationCampaigns,
  donationVerificationEvents,
  donations,
  storedObjects,
} from "@/db/schema";
import { auditLogs } from "@/db/schema/audit-logs";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { userCanReviewChurchMemberships } from "@/lib/postgres/session";
import { churches } from "@/db/schema/tenants";
import { putObjectBytes, createPresignedGetUrl, deleteStoredObject } from "@/lib/storage/s3";

import { decodeUpiQrImage } from "./upi-qr";
import {
  accountLast4,
  donationFieldEncryptionConfigured,
  encryptDonationField,
  imageBytesMatchDeclaredType,
  inrAmountToPaise,
  isIfscFormat,
  isIndianAccountNumber,
  isUpiIdFormat,
  maskAccountNumber,
  paiseToInrString,
  sameDonationSubmission,
  type ChurchReceivingMethod,
} from "./receiving-validation";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export class DonationAccessError extends Error {
  constructor(message = "You do not have access to this church.") {
    super(message);
    this.name = "DonationAccessError";
  }
}

async function requireManager(clerkId: string, churchId: string) {
  const user = await getAppUserByClerkId(clerkId);
  if (!user) throw new DonationAccessError();
  const allowed = await userCanReviewChurchMemberships(clerkId, user.email, churchId);
  if (!allowed) throw new DonationAccessError();
  const [church] = await db
    .select({
      id: churches.id,
      organizationId: churches.organizationId,
    })
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  if (!church) throw new DonationAccessError();
  return { user, church };
}

export async function getChurchDonationSettings(clerkId: string, churchId: string) {
  await requireManager(clerkId, churchId);
  const [profile] = await db
    .select()
    .from(churchDonationProfiles)
    .where(eq(churchDonationProfiles.churchId, churchId))
    .limit(1);
  const methods = await db
    .select()
    .from(churchDonationMethods)
    .where(eq(churchDonationMethods.churchId, churchId));
  return {
    authorizedDeclaration: profile?.authorizedDeclaration ?? false,
    declarationAcceptedAt: profile?.declarationAcceptedAt?.toISOString() ?? null,
    foreignDonationsEnabled: false,
    gatewayStatus: "unavailable" as const,
    donorAcknowledgement: profile?.donorAcknowledgement ?? "",
    encryptionConfigured: donationFieldEncryptionConfigured(),
    authorizationState: profile?.authorizedDeclaration
      ? ("confirmed" as const)
      : profile?.declarationAcceptedAt
        ? ("needs_review" as const)
        : ("pending" as const),
    methods: methods.map((method) => ({
      method: method.method,
      enabled: method.enabled,
      displayName: method.displayName,
      instructions: method.instructions ?? "",
      upiId: method.upiId ?? "",
      accountHolderName: method.accountHolderName ?? "",
      bankName: method.bankName ?? "",
      accountNumberMasked: method.accountNumberLast4
        ? `•••• ${method.accountNumberLast4}`
        : "",
      ifscCode: method.ifscCode ?? "",
      branchName: method.branchName ?? "",
      ownershipStatus: method.ownershipStatus,
      hasQr: Boolean(method.qrStoredObjectId),
      donorStatus: receivingStatus({
        valid:
          method.method === "upi_qr"
            ? Boolean(method.qrStoredObjectId && method.upiId && isUpiIdFormat(method.upiId))
            : method.method === "upi_id"
              ? Boolean(method.upiId && isUpiIdFormat(method.upiId))
              : method.method === "bank_transfer"
                ? Boolean(
                    method.accountHolderName &&
                      method.bankName &&
                      method.accountNumberLast4 &&
                      method.ifscCode &&
                      isIfscFormat(method.ifscCode)
                  )
                : false,
        enabled: method.enabled,
        authorized: profile?.authorizedDeclaration ?? false,
        needsReview: Boolean(profile?.declarationAcceptedAt) && !profile?.authorizedDeclaration,
      }),
    })),
  };
}

function receivingStatus(input: {
  valid: boolean;
  enabled: boolean;
  authorized: boolean;
  needsReview: boolean;
}) {
  if (!input.valid) return "not_configured" as const;
  if (!input.enabled) return "disabled" as const;
  if (input.authorized) return "ready" as const;
  if (input.needsReview) return "needs_review" as const;
  return "draft" as const;
}

const DONOR_ACK_LIMIT = 400;

export async function saveDonorAcknowledgement(input: {
  clerkId: string;
  churchId: string;
  message: string;
}) {
  const { church } = await requireManager(input.clerkId, input.churchId);
  const message = input.message.trim();
  if (message.length > DONOR_ACK_LIMIT) {
    throw new Error("The thank-you message must be 400 characters or fewer.");
  }
  await db
    .insert(churchDonationProfiles)
    .values({
      churchId: church.id,
      organizationId: church.organizationId,
      authorizedDeclaration: false,
      donorAcknowledgement: message || null,
    })
    .onConflictDoUpdate({
      target: churchDonationProfiles.churchId,
      set: {
        donorAcknowledgement: message || null,
        updatedAt: new Date(),
      },
    });
}

export async function saveChurchDonationDeclaration(input: {
  clerkId: string;
  churchId: string;
  accepted: boolean;
}) {
  const { user, church } = await requireManager(input.clerkId, input.churchId);
  if (!input.accepted) {
    throw new Error("The church must confirm it is authorized to receive donations.");
  }
  await db
    .insert(churchDonationProfiles)
    .values({
      churchId: church.id,
      organizationId: church.organizationId,
      authorizedDeclaration: true,
      declarationAcceptedAt: new Date(),
      declarationAcceptedBy: user.id,
      foreignDonationsEnabled: false,
    })
    .onConflictDoUpdate({
      target: churchDonationProfiles.churchId,
      set: {
        authorizedDeclaration: true,
        declarationAcceptedAt: new Date(),
        declarationAcceptedBy: user.id,
        foreignDonationsEnabled: false,
        updatedAt: new Date(),
      },
    });
}

async function revokeAuthorization(churchId: string) {
  const [profile] = await db
    .select({ ok: churchDonationProfiles.authorizedDeclaration })
    .from(churchDonationProfiles)
    .where(eq(churchDonationProfiles.churchId, churchId))
    .limit(1);
  if (!profile?.ok) return false;
  await db
    .update(churchDonationProfiles)
    .set({ authorizedDeclaration: false, updatedAt: new Date() })
    .where(eq(churchDonationProfiles.churchId, churchId));
  return true;
}

export async function saveChurchReceivingMethod(input: {
  clerkId: string;
  churchId: string;
  method: ChurchReceivingMethod;
  enabled: boolean;
  displayName: string;
  instructions?: string;
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}) {
  const { church } = await requireManager(input.clerkId, input.churchId);
  const displayName = input.displayName.trim();
  if (input.enabled && displayName.length < 2) {
    throw new Error("A display name is required.");
  }
  if (input.method === "upi_id" && input.enabled) {
    if (!input.upiId || !isUpiIdFormat(input.upiId)) {
      throw new Error("Enter a valid UPI ID. Format checks do not prove ownership.");
    }
  }
  let ciphertext: string | null = null;
  let last4: string | null = null;
  if (input.method === "bank_transfer") {
    if (input.enabled) {
      if (!input.accountHolderName?.trim() || !input.bankName?.trim()) {
        throw new Error("Account holder and bank name are required.");
      }
      if (!input.ifscCode || !isIfscFormat(input.ifscCode)) {
        throw new Error("Enter a valid IFSC code.");
      }
    }
    if (input.accountNumber?.trim()) {
      if (!isIndianAccountNumber(input.accountNumber)) {
        throw new Error("Enter a valid account number.");
      }
      ciphertext = encryptDonationField(input.accountNumber.trim());
      last4 = accountLast4(input.accountNumber);
    }
  }

  const existing = await db
    .select({
      id: churchDonationMethods.id,
      ciphertext: churchDonationMethods.accountNumberCiphertext,
      last4: churchDonationMethods.accountNumberLast4,
      upiId: churchDonationMethods.upiId,
      accountHolderName: churchDonationMethods.accountHolderName,
      bankName: churchDonationMethods.bankName,
      ifscCode: churchDonationMethods.ifscCode,
      branchName: churchDonationMethods.branchName,
    })
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, church.id),
        eq(churchDonationMethods.method, input.method)
      )
    )
    .limit(1);

  const values = {
    churchId: church.id,
    organizationId: church.organizationId,
    method: input.method,
    enabled: input.enabled,
    displayName,
    instructions: input.instructions?.trim() || null,
    upiId: input.method === "upi_id" ? input.upiId?.trim() || null : null,
    accountHolderName: input.accountHolderName?.trim() || null,
    bankName: input.bankName?.trim() || null,
    ifscCode: input.ifscCode?.trim().toUpperCase() || null,
    branchName: input.branchName?.trim() || null,
    ownershipStatus: "declared",
    accountNumberCiphertext: ciphertext ?? existing[0]?.ciphertext ?? null,
    accountNumberLast4: last4 ?? existing[0]?.last4 ?? null,
    updatedAt: new Date(),
  };

  if (input.method === "bank_transfer" && input.enabled && !values.accountNumberCiphertext) {
    throw new Error("An account number is required.");
  }

  await db
    .insert(churchDonationMethods)
    .values(values)
    .onConflictDoUpdate({
      target: [churchDonationMethods.churchId, churchDonationMethods.method],
      set: values,
    });

  const prior = existing[0];
  const material =
    input.method === "upi_id"
      ? (prior?.upiId ?? "") !== (values.upiId ?? "")
      : input.method === "bank_transfer"
        ? (prior?.accountHolderName ?? "") !== (values.accountHolderName ?? "") ||
          (prior?.bankName ?? "") !== (values.bankName ?? "") ||
          (prior?.ifscCode ?? "") !== (values.ifscCode ?? "") ||
          (prior?.branchName ?? "") !== (values.branchName ?? "") ||
          (last4 !== null && last4 !== (prior?.last4 ?? null))
        : false;
  const authorizationRevoked = material ? await revokeAuthorization(church.id) : false;
  return { authorizationRevoked };
}

function assertQrFile(mimeType: string, bytes: Buffer) {
  if (
    !IMAGE_TYPES.has(mimeType) ||
    bytes.length > MAX_IMAGE_BYTES ||
    bytes.length < 12 ||
    !imageBytesMatchDeclaredType(mimeType, bytes)
  ) {
    throw new Error("Upload a JPEG, PNG, or WebP image up to 2 MB.");
  }
}

export async function inspectChurchQr(input: {
  clerkId: string;
  churchId: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const { church } = await requireManager(input.clerkId, input.churchId);
  assertQrFile(input.mimeType, input.bytes);
  const decoded = await decodeUpiQrImage(input.bytes);
  const [configured] = await db
    .select({ upiId: churchDonationMethods.upiId })
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, church.id),
        eq(churchDonationMethods.method, "upi_id")
      )
    )
    .limit(1);
  const configuredUpiId = configured?.upiId?.trim() ?? "";
  const mismatch = Boolean(
    configuredUpiId && configuredUpiId.toLowerCase() !== decoded.upiId.toLowerCase()
  );
  return { ...decoded, configuredUpiId, mismatch };
}

export async function saveChurchQrImage(input: {
  clerkId: string;
  churchId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  confirmDetails: boolean;
  confirmMismatch: boolean;
}) {
  const { user, church } = await requireManager(input.clerkId, input.churchId);
  assertQrFile(input.mimeType, input.bytes);
  const decoded = await decodeUpiQrImage(input.bytes);
  if (!input.confirmDetails) {
    throw new Error("Confirm the decoded payee before saving. This does not prove ownership.");
  }
  const [configured] = await db
    .select({ upiId: churchDonationMethods.upiId })
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, church.id),
        eq(churchDonationMethods.method, "upi_id")
      )
    )
    .limit(1);
  const configuredUpiId = configured?.upiId?.trim() ?? "";
  const mismatch = Boolean(
    configuredUpiId && configuredUpiId.toLowerCase() !== decoded.upiId.toLowerCase()
  );
  if (mismatch && !input.confirmMismatch) {
    throw new Error("The QR payee does not match the saved UPI ID. Confirm the mismatch before saving.");
  }
  const extension = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  const objectKey = `churches/${church.id}/donation-qr/${randomUUID()}.${extension}`;
  try {
    await putObjectBytes({
      objectKey,
      body: input.bytes,
      contentType: input.mimeType,
    });
  } catch {
    throw new Error("Could not store the QR image.");
  }
  const [stored] = await db
    .insert(storedObjects)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      uploadedBy: user.id,
      objectKey,
      originalFilename: input.fileName.slice(0, 180) || `qr.${extension}`,
      mimeType: input.mimeType,
      extension,
      sizeBytes: input.bytes.length,
      sha256: createHash("sha256").update(input.bytes).digest("hex"),
      visibility: "private",
      status: "ready",
      purpose: "image",
      published: false,
      readyAt: new Date(),
    })
    .returning({ id: storedObjects.id });
  if (!stored) throw new Error("Could not store the QR image.");

  await db
    .insert(churchDonationMethods)
    .values({
      churchId: church.id,
      organizationId: church.organizationId,
      method: "upi_qr",
      enabled: true,
      displayName: decoded.payeeName || "UPI QR",
      upiId: decoded.upiId,
      qrStoredObjectId: stored.id,
      ownershipStatus: "declared",
    })
    .onConflictDoUpdate({
      target: [churchDonationMethods.churchId, churchDonationMethods.method],
      set: {
        qrStoredObjectId: stored.id,
        displayName: decoded.payeeName || "UPI QR",
        upiId: decoded.upiId,
        updatedAt: new Date(),
      },
    });
  const authorizationRevoked = await revokeAuthorization(church.id);
  return { storedObjectId: stored.id, authorizationRevoked };
}

export async function removeChurchQr(clerkId: string, churchId: string) {
  await requireManager(clerkId, churchId);
  const [method] = await db
    .select({ objectId: churchDonationMethods.qrStoredObjectId })
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, churchId),
        eq(churchDonationMethods.method, "upi_qr")
      )
    )
    .limit(1);
  if (method?.objectId) {
    const [object] = await db
      .select({ key: storedObjects.objectKey, churchId: storedObjects.churchId })
      .from(storedObjects)
      .where(eq(storedObjects.id, method.objectId))
      .limit(1);
    if (object && object.churchId === churchId) {
      await deleteStoredObject(object.key).catch(() => "missing" as const);
    }
  }
  await db
    .update(churchDonationMethods)
    .set({
      enabled: false,
      qrStoredObjectId: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(churchDonationMethods.churchId, churchId),
        eq(churchDonationMethods.method, "upi_qr")
      )
    );
}

export async function previewChurchQr(clerkId: string, churchId: string) {
  await requireManager(clerkId, churchId);
  const [method] = await db
    .select({ objectId: churchDonationMethods.qrStoredObjectId })
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, churchId),
        eq(churchDonationMethods.method, "upi_qr")
      )
    )
    .limit(1);
  if (!method?.objectId) return null;
  const [object] = await db
    .select({ key: storedObjects.objectKey, churchId: storedObjects.churchId })
    .from(storedObjects)
    .where(eq(storedObjects.id, method.objectId))
    .limit(1);
  if (!object || object.churchId !== churchId) return null;
  const url = await createPresignedGetUrl({ objectKey: object.key, expiresIn: 120 });
  return { url };
}

async function enabledMethodsForCampaign(campaignId: string, churchId: string) {
  const selected = await db
    .select({ method: donationCampaignMethods.method })
    .from(donationCampaignMethods)
    .where(eq(donationCampaignMethods.campaignId, campaignId));
  const rows = await db
    .select()
    .from(churchDonationMethods)
    .where(
      and(
        eq(churchDonationMethods.churchId, churchId),
        eq(churchDonationMethods.enabled, true),
        inArray(churchDonationMethods.method, ["upi_qr", "upi_id", "bank_transfer"])
      )
    );
  const allow = new Set(selected.map((row) => row.method));
  return rows.filter((row) => allow.size === 0 || allow.has(row.method));
}

export async function publicCampaignMethods(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(donationCampaigns)
    .where(eq(donationCampaigns.id, campaignId))
    .limit(1);
  if (!campaign || campaign.status !== "active" || !campaign.churchId) {
    return { methods: [], donorAcknowledgement: "" };
  }
  if (campaign.currency !== "INR") return { methods: [], donorAcknowledgement: "" };
  const now = Date.now();
  if (campaign.startsAt && campaign.startsAt.getTime() > now) {
    return { methods: [], donorAcknowledgement: "" };
  }
  if (campaign.endsAt && campaign.endsAt.getTime() < now) {
    return { methods: [], donorAcknowledgement: "" };
  }
  const [profile] = await db
    .select({
      donorAcknowledgement: churchDonationProfiles.donorAcknowledgement,
      authorized: churchDonationProfiles.authorizedDeclaration,
    })
    .from(churchDonationProfiles)
    .where(eq(churchDonationProfiles.churchId, campaign.churchId))
    .limit(1);
  if (!profile?.authorized) {
    return { methods: [], donorAcknowledgement: profile?.donorAcknowledgement?.trim() ?? "" };
  }
  const methods = await enabledMethodsForCampaign(campaign.id, campaign.churchId);
  const result = [];
  for (const method of methods) {
    if (method.method === "upi_qr" && method.qrStoredObjectId) {
      const [object] = await db
        .select({ key: storedObjects.objectKey, churchId: storedObjects.churchId })
        .from(storedObjects)
        .where(eq(storedObjects.id, method.qrStoredObjectId))
        .limit(1);
      if (!object || object.churchId !== campaign.churchId) continue;
      const url = await createPresignedGetUrl({ objectKey: object.key, expiresIn: 300 });
      result.push({
        method: method.method,
        displayName: method.displayName,
        instructions: method.instructions ?? "",
        qrUrl: url,
      });
    } else if (method.method === "upi_id" && method.upiId) {
      result.push({
        method: method.method,
        displayName: method.displayName,
        instructions: method.instructions ?? "",
        upiId: method.upiId,
      });
    } else if (method.method === "bank_transfer" && method.accountNumberLast4) {
      result.push({
        method: method.method,
        displayName: method.displayName,
        instructions: method.instructions ?? "",
        accountHolderName: method.accountHolderName,
        bankName: method.bankName,
        accountNumber: maskAccountNumber(method.accountNumberLast4),
        ifscCode: method.ifscCode,
        branchName: method.branchName ?? "",
        ownershipStatus: "declared" as const,
      });
    }
  }
  return {
    methods: result,
    donorAcknowledgement: profile?.donorAcknowledgement?.trim() ?? "",
  };
}

export async function submitChurchDonation(input: {
  campaignId: string;
  method: "upi_qr" | "upi_id" | "bank_transfer";
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  isAnonymous: boolean;
  paymentReference: string;
  idempotencyKey?: string;
}) {
  const reference = input.paymentReference.trim();
  if (reference.length < 4 || reference.length > 80) {
    throw new Error("Enter the payment reference from your UPI or bank receipt.");
  }
  const amountPaise = inrAmountToPaise(input.amount);
  if (amountPaise === null) {
    throw new Error("Enter a valid amount in INR.");
  }
  const amount = paiseToInrString(amountPaise);
  const [campaign] = await db
    .select()
    .from(donationCampaigns)
    .where(eq(donationCampaigns.id, input.campaignId))
    .limit(1);
  if (!campaign?.churchId || campaign.status !== "active" || campaign.currency !== "INR") {
    throw new Error("This campaign is not accepting donations.");
  }
  const methods = await enabledMethodsForCampaign(campaign.id, campaign.churchId);
  if (!methods.some((method) => method.method === input.method)) {
    throw new Error("That receiving method is not available.");
  }
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const donorEmail = input.donorEmail.trim().toLowerCase();
  if (idempotencyKey) {
    const [existing] = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        donorEmail: donations.donorEmail,
      })
      .from(donations)
      .where(eq(donations.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) {
      if (
        !sameDonationSubmission(existing, {
          campaignId: campaign.id,
          amountPaise,
          donorEmail,
        })
      ) {
        throw new Error("This submission key was already used.");
      }
      return { id: existing.id, reused: true };
    }
  }
  const [row] = await db
    .insert(donations)
    .values({
      contentScope: "organization",
      organizationId: campaign.organizationId,
      churchId: campaign.churchId,
      campaignId: campaign.id,
      donorName: input.isAnonymous ? "Anonymous" : input.donorName.trim(),
      donorEmail,
      donorPhone: input.donorPhone?.trim() || null,
      amount,
      currency: "INR",
      paymentStatus: "pending",
      paymentProvider: "church_direct",
      transactionId: `ref_${randomUUID()}`,
      idempotencyKey,
      isAnonymous: input.isAnonymous,
      receivingMethod: input.method,
      verificationStatus: "awaiting_verification",
      recordSource: "member_submission",
      paymentReference: reference,
    })
    .returning({ id: donations.id });
  if (!row) throw new Error("Could not record the donation.");
  await db.insert(donationVerificationEvents).values({
    donationId: row.id,
    organizationId: campaign.organizationId,
    churchId: campaign.churchId,
    action: "submitted",
    reason: null,
  });
  return { id: row.id, reused: false };
}

export async function recordOfflineDonation(input: {
  clerkId: string;
  churchId: string;
  campaignId: string;
  amount: number;
  donatedOn: string;
  donorName?: string;
  donorPhone?: string;
  notes?: string;
  idempotencyKey?: string;
}) {
  const { user, church } = await requireManager(input.clerkId, input.churchId);
  const [campaign] = await db
    .select()
    .from(donationCampaigns)
    .where(
      and(
        eq(donationCampaigns.id, input.campaignId),
        eq(donationCampaigns.churchId, church.id)
      )
    )
    .limit(1);
  if (!campaign || campaign.currency !== "INR") {
    throw new Error("Choose an INR campaign for this church.");
  }
  const amountPaise = inrAmountToPaise(input.amount);
  if (amountPaise === null) {
    throw new Error("Enter a valid amount in INR.");
  }
  const amount = paiseToInrString(amountPaise);
  const donatedOn = new Date(input.donatedOn);
  if (Number.isNaN(donatedOn.getTime())) throw new Error("Enter a valid donation date.");
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const [existing] = await db
      .select({
        id: donations.id,
        campaignId: donations.campaignId,
        amount: donations.amount,
        donorEmail: donations.donorEmail,
      })
      .from(donations)
      .where(eq(donations.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) {
      if (
        !sameDonationSubmission(existing, {
          campaignId: campaign.id,
          amountPaise,
          donorEmail: "offline@church.local",
        })
      ) {
        throw new Error("This submission key was already used.");
      }
      return { id: existing.id };
    }
  }
  const rowId = await db.transaction(async (tx) => {
  const [row] = await tx
    .insert(donations)
    .values({
      contentScope: "organization",
      organizationId: church.organizationId,
      churchId: church.id,
      campaignId: campaign.id,
      donorName: input.donorName?.trim() || "Offline donor",
      donorEmail: "offline@church.local",
      donorPhone: input.donorPhone?.trim() || null,
      amount,
      currency: "INR",
      paymentStatus: "completed",
      paymentProvider: "church_direct",
        transactionId: `offline_${randomUUID()}`,
        idempotencyKey,
      isAnonymous: !input.donorName?.trim(),
      receivingMethod: "offline",
      verificationStatus: "verified",
      recordSource: "admin_offline",
      internalNotes: input.notes?.trim() || null,
      recordedByUserId: user.id,
      verifiedByUserId: user.id,
      verifiedAt: donatedOn,
      createdAt: donatedOn,
    })
    .returning({ id: donations.id });
  if (!row) throw new Error("Could not record the offline donation.");
  await tx
    .update(donationCampaigns)
    .set({
      currentAmount: sql`${donationCampaigns.currentAmount} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(donationCampaigns.id, campaign.id),
        eq(donationCampaigns.churchId, church.id)
      )
    );
  await tx.insert(donationVerificationEvents).values({
    donationId: row.id,
    organizationId: church.organizationId,
    churchId: church.id,
    action: "recorded_offline",
    actorUserId: user.id,
  });
  await tx.insert(auditLogs).values({
    actorUserId: user.id,
    action: "donation.recorded_offline",
    organizationId: church.organizationId,
    churchId: church.id,
    entityType: "donation",
    entityId: row.id,
    metadata: { source: "admin_offline" },
  });
  return row.id;
  });
  return { id: rowId };
}

export async function reviewChurchDonation(input: {
  clerkId: string;
  churchId: string;
  donationId: string;
  decision: "verified" | "rejected";
  reason?: string;
}) {
  const { user, church } = await requireManager(input.clerkId, input.churchId);
  if (input.decision === "rejected" && (input.reason?.trim().length ?? 0) < 3) {
    throw new Error("A rejection reason is required.");
  }
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(donations)
      .where(
        and(eq(donations.id, input.donationId), eq(donations.churchId, church.id))
      )
      .limit(1);
    if (!existing) throw new DonationAccessError("Donation not found.");
    if (existing.recordSource !== "member_submission") {
      throw new Error("Only member submissions can be reviewed.");
    }
    if (existing.verificationStatus !== "awaiting_verification") {
      throw new Error("This donation has already been reviewed.");
    }
    if (existing.recordedByUserId && existing.recordedByUserId === user.id) {
      throw new Error("You cannot verify your own submission.");
    }
    const nextStatus = input.decision === "verified" ? "completed" : "failed";
    const [updated] = await tx
      .update(donations)
      .set({
        paymentStatus: nextStatus,
        verificationStatus: input.decision,
        rejectionReason: input.decision === "rejected" ? input.reason?.trim() : null,
        verifiedByUserId: user.id,
        verifiedAt: new Date(),
      })
      .where(
        and(
          eq(donations.id, existing.id),
          eq(donations.churchId, church.id),
          eq(donations.verificationStatus, "awaiting_verification")
        )
      )
      .returning({ id: donations.id });
    if (!updated) throw new Error("This donation has already been reviewed.");
    if (input.decision === "verified") {
      await tx
        .update(donationCampaigns)
        .set({
          currentAmount: sql`${donationCampaigns.currentAmount} + ${existing.amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(donationCampaigns.id, existing.campaignId),
            eq(donationCampaigns.churchId, church.id)
          )
        );
    }
    await tx.insert(donationVerificationEvents).values({
      donationId: existing.id,
      organizationId: church.organizationId,
      churchId: church.id,
      action: input.decision,
      actorUserId: user.id,
      reason: input.reason?.trim() || null,
    });
    await tx.insert(auditLogs).values({
      actorUserId: user.id,
      action: `donation.${input.decision}`,
      organizationId: church.organizationId,
      churchId: church.id,
      entityType: "donation",
      entityId: existing.id,
      metadata: { method: existing.receivingMethod },
    });
  });
}

export async function churchDonationReport(input: {
  clerkId: string;
  churchId: string;
  from?: string;
  to?: string;
}) {
  await requireManager(input.clerkId, input.churchId);
  const filters = [eq(donations.churchId, input.churchId)];
  if (input.from) {
    const from = new Date(input.from);
    if (Number.isNaN(from.getTime())) throw new Error("Enter a valid start date.");
    filters.push(gte(donations.createdAt, from));
  }
  if (input.to) {
    const to = new Date(input.to);
    if (Number.isNaN(to.getTime())) throw new Error("Enter a valid end date.");
    filters.push(lte(donations.createdAt, to));
  }
  const where = and(...filters);
  const [totals] = await db
    .select({
      verified: sql<string>`coalesce(sum(case when ${donations.verificationStatus} = 'verified' or (${donations.recordSource} = 'gateway' and ${donations.paymentStatus} = 'completed') then ${donations.amount} else 0 end), 0)`,
      pending: sql<string>`coalesce(sum(case when ${donations.verificationStatus} = 'awaiting_verification' then ${donations.amount} else 0 end), 0)`,
      rejected: sql<string>`coalesce(sum(case when ${donations.verificationStatus} = 'rejected' then ${donations.amount} else 0 end), 0)`,
    })
    .from(donations)
    .where(where);
  const rows = await db
    .select({
      id: donations.id,
      amount: donations.amount,
      campaignId: donations.campaignId,
      receivingMethod: donations.receivingMethod,
      verificationStatus: donations.verificationStatus,
      paymentStatus: donations.paymentStatus,
      recordSource: donations.recordSource,
      donorName: donations.donorName,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .where(where)
    .orderBy(desc(donations.createdAt))
    .limit(50);
  return {
    verifiedTotal: String(totals?.verified ?? "0"),
    pendingTotal: String(totals?.pending ?? "0"),
    rejectedTotal: String(totals?.rejected ?? "0"),
    rows: rows.map((row) => ({
      ...row,
      amount: String(row.amount),
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function setCampaignReceivingMethods(input: {
  clerkId: string;
  churchId: string;
  campaignId: string;
  methods: ChurchReceivingMethod[];
}) {
  const { church } = await requireManager(input.clerkId, input.churchId);
  const [campaign] = await db
    .select({ id: donationCampaigns.id })
    .from(donationCampaigns)
    .where(
      and(
        eq(donationCampaigns.id, input.campaignId),
        eq(donationCampaigns.churchId, church.id)
      )
    )
    .limit(1);
  if (!campaign) throw new DonationAccessError();
  await db
    .delete(donationCampaignMethods)
    .where(eq(donationCampaignMethods.campaignId, campaign.id));
  const unique = [...new Set(input.methods)];
  if (unique.length === 0) return;
  await db.insert(donationCampaignMethods).values(
    unique.map((method) => ({ campaignId: campaign.id, method }))
  );
}

export function maskedAccountForAdmin(last4: string | null): string {
  return last4 ? maskAccountNumber(last4) : "";
}
