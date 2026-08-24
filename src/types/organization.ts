import type { PlanId } from "@/types/subscription";

export type OrganizationStatus = "active" | "suspended" | "trial";

export type WorkspaceType = "independent_church" | "multi_church_org";

export type OrganizationSettings = {
  defaultTimezone?: string;
  defaultLanguage?: string;
  country?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  workspaceType?: WorkspaceType;
  defaultCurrency?: string;
  allowPublicSignup?: boolean;
  brandingLocked?: boolean;
};

export type FirebaseOrganization = {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  ownerId: string;
  subscriptionPlan: PlanId;
  status: OrganizationStatus;
  settings?: OrganizationSettings;
  createdAt: number;
  updatedAt: number;
};

export type CreateOrganizationInput = {
  name: string;
  logo?: string;
  description?: string;
  ownerId: string;
  subscriptionPlan?: PlanId;
  status?: OrganizationStatus;
  settings?: OrganizationSettings;
};

export type UpdateOrganizationInput = Partial<
  Omit<CreateOrganizationInput, "ownerId">
>;
