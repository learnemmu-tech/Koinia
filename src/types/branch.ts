import type { EnrollmentMode } from "@/types/enrollment";

export type BranchSettings = {
  serviceTimes?: string[];
  parkingNotes?: string;
  accessibilityNotes?: string;
  /** How members enroll via the join URL. Default: approval_required */
  enrollmentMode?: EnrollmentMode;
  /** When false, the public join URL is disabled. Default: true */
  joinUrlEnabled?: boolean;
};

/** Former public join slugs invalidated after regeneration. */
export type BranchRetiredSlugs = string[];

export type FirebaseBranch = {
  id: string;
  organizationId: string;
  churchId: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  /** System-created default campus — cannot be deleted while true */
  isDefault?: boolean;
  settings?: BranchSettings;
  /** Invalidated join slugs — safe to query for expired link messaging */
  retiredJoinSlugs?: string[];
  createdAt: number;
  updatedAt: number;
};

export type CreateBranchInput = {
  organizationId: string;
  churchId: string;
  name: string;
  slug?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  isDefault?: boolean;
  settings?: BranchSettings;
  retiredJoinSlugs?: string[];
};

export type UpdateBranchInput = Partial<
  Omit<CreateBranchInput, "organizationId" | "churchId">
>;
