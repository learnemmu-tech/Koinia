import type { MembershipRole } from "@/types/membership";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationDeliveryMethod = "email" | "link";

export type FirebaseInvitation = {
  id: string;
  organizationId: string;
  churchId: string;
  branchId: string;
  role: MembershipRole;
  email?: string;
  deliveryMethod: InvitationDeliveryMethod;
  token: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: number;
  acceptedAt?: number;
  acceptedBy?: string;
  createdAt: number;
  updatedAt: number;
};

export type CreateInvitationInput = {
  organizationId: string;
  churchId: string;
  branchId: string;
  role: MembershipRole;
  invitedBy: string;
  email?: string;
  deliveryMethod: InvitationDeliveryMethod;
  /** Days until expiry — default 14 */
  expiresInDays?: number;
};
