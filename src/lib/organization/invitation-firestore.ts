import { randomBytes } from "crypto";

import type {
  CreateInvitationInput,
  FirebaseInvitation,
  InvitationDeliveryMethod,
  InvitationStatus,
} from "@/types/invitation";
import type { MembershipRole } from "@/types/membership";

import { toMillis } from "@/lib/firebase-utils";

export const INVITATIONS_COLLECTION = "invitations";

const VALID_STATUSES: InvitationStatus[] = [
  "pending",
  "accepted",
  "expired",
  "revoked",
];

const VALID_METHODS: InvitationDeliveryMethod[] = ["email", "link"];

const VALID_ROLES: MembershipRole[] = [
  "owner",
  "org_admin",
  "church_admin",
  "branch_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
];

const DEFAULT_EXPIRY_DAYS = 14;

function normalizeStatus(value: unknown): InvitationStatus {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (VALID_STATUSES.includes(status as InvitationStatus)) {
    return status as InvitationStatus;
  }
  return "pending";
}

function normalizeMethod(value: unknown): InvitationDeliveryMethod {
  const method = String(value ?? "email").trim().toLowerCase();
  if (VALID_METHODS.includes(method as InvitationDeliveryMethod)) {
    return method as InvitationDeliveryMethod;
  }
  return "email";
}

function normalizeRole(value: unknown): MembershipRole {
  const role = String(value ?? "member").trim().toLowerCase();
  if (VALID_ROLES.includes(role as MembershipRole)) {
    return role as MembershipRole;
  }
  return "member";
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function computeInvitationExpiryMs(expiresInDays = DEFAULT_EXPIRY_DAYS): number {
  return Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
}

export function normalizeInvitationFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseInvitation {
  const email = String(data.email ?? "").trim();
  return {
    id,
    organizationId: String(data.organizationId ?? "").trim(),
    churchId: String(data.churchId ?? "").trim(),
    branchId: String(data.branchId ?? "").trim(),
    role: normalizeRole(data.role),
    email: email || undefined,
    deliveryMethod: normalizeMethod(data.deliveryMethod),
    token: String(data.token ?? "").trim(),
    invitedBy: String(data.invitedBy ?? "").trim(),
    status: normalizeStatus(data.status),
    expiresAt: toMillis(data.expiresAt),
    acceptedAt: data.acceptedAt ? toMillis(data.acceptedAt) : undefined,
    acceptedBy: data.acceptedBy ? String(data.acceptedBy) : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildInvitationCreatePayload(input: CreateInvitationInput) {
  const expiresInDays = input.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  return {
    organizationId: input.organizationId.trim(),
    churchId: input.churchId.trim(),
    branchId: input.branchId.trim(),
    role: input.role,
    email: input.email?.trim().toLowerCase() || null,
    deliveryMethod: input.deliveryMethod,
    token: generateInvitationToken(),
    invitedBy: input.invitedBy.trim(),
    status: "pending" as const,
    expiresAt: computeInvitationExpiryMs(expiresInDays),
  };
}

export function isInvitationExpired(invitation: FirebaseInvitation): boolean {
  if (invitation.status !== "pending") return invitation.status === "expired";
  return Date.now() > invitation.expiresAt;
}
