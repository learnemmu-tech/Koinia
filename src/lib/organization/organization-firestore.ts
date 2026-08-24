import type {
  CreateOrganizationInput,
  FirebaseOrganization,
  OrganizationSettings,
  OrganizationStatus,
} from "@/types/organization";
import type { PlanId } from "@/types/subscription";

import { toMillis } from "@/lib/firebase-utils";

export const ORGANIZATIONS_COLLECTION = "organizations";

const VALID_STATUSES: OrganizationStatus[] = ["active", "suspended", "trial"];
const VALID_PLANS: PlanId[] = [
  "free",
  "starter",
  "professional",
  "enterprise",
];

function normalizeStatus(value: unknown): OrganizationStatus {
  const status = String(value ?? "active").trim().toLowerCase();
  if (VALID_STATUSES.includes(status as OrganizationStatus)) {
    return status as OrganizationStatus;
  }
  return "active";
}

function normalizePlan(value: unknown): PlanId {
  const plan = String(value ?? "free").trim().toLowerCase();
  if (VALID_PLANS.includes(plan as PlanId)) {
    return plan as PlanId;
  }
  return "free";
}

function normalizeWorkspaceType(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (
    raw === "multi_church_org" ||
    raw === "multi_org" ||
    raw === "multi_church"
  ) {
    return "multi_church_org" as const;
  }
  if (raw === "independent_church" || raw === "independent") {
    return "independent_church" as const;
  }
  return undefined;
}

function normalizeSettings(data: unknown): OrganizationSettings | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = data as Record<string, unknown>;
  const workspaceType = normalizeWorkspaceType(raw.workspaceType);
  return {
    defaultTimezone: raw.defaultTimezone ?
        String(raw.defaultTimezone)
      : undefined,
    defaultLanguage: raw.defaultLanguage ?
        String(raw.defaultLanguage)
      : undefined,
    country: raw.country ? String(raw.country) : undefined,
    city: raw.city ? String(raw.city) : undefined,
    state: raw.state ? String(raw.state) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    email: raw.email ? String(raw.email) : undefined,
    website: raw.website ? String(raw.website) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    workspaceType,
    defaultCurrency: raw.defaultCurrency ?
        String(raw.defaultCurrency)
      : undefined,
    allowPublicSignup: raw.allowPublicSignup !== false,
    brandingLocked: Boolean(raw.brandingLocked),
  };
}

export function normalizeOrganizationFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseOrganization {
  const settings = normalizeSettings(data.settings);
  const rootWorkspaceType = normalizeWorkspaceType(data.workspaceType);

  return {
    id,
    name: String(data.name ?? "").trim(),
    logo:
      String(data.logo ?? data.logoUrl ?? "").trim() || undefined,
    description: String(data.description ?? "").trim() || undefined,
    ownerId: String(data.ownerId ?? "").trim(),
    subscriptionPlan: normalizePlan(data.subscriptionPlan),
    status: normalizeStatus(data.status),
    settings: {
      ...settings,
      workspaceType: settings?.workspaceType ?? rootWorkspaceType,
    },
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

function omitUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
}

export function buildOrganizationCreatePayload(
  input: CreateOrganizationInput
): Record<string, unknown> {
  return {
    name: input.name.trim(),
    logo: input.logo?.trim() || "",
    description: input.description?.trim() || "",
    ownerId: input.ownerId.trim(),
    subscriptionPlan: input.subscriptionPlan ?? "free",
    status: input.status ?? "active",
    settings: omitUndefinedFields(
      (input.settings ?? {}) as Record<string, unknown>
    ),
  };
}

export function buildOrganizationUpdatePayload(
  input: Partial<CreateOrganizationInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.logo !== undefined) payload.logo = input.logo.trim();
  if (input.description !== undefined) {
    payload.description = input.description.trim();
  }
  if (input.subscriptionPlan !== undefined) {
    payload.subscriptionPlan = input.subscriptionPlan;
  }
  if (input.status !== undefined) payload.status = input.status;
  if (input.settings !== undefined) {
    payload.settings = omitUndefinedFields(
      input.settings as Record<string, unknown>
    );
  }
  return payload;
}

export function buildMembershipId(
  organizationId: string,
  userId: string
): string {
  return `${organizationId}_${userId}`;
}
