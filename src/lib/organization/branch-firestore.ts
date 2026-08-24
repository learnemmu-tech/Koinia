import type {
  CreateBranchInput,
  FirebaseBranch,
  BranchSettings,
} from "@/types/branch";

import { slugifyChurchSlug, isValidChurchSlug } from "@/lib/church-scope";
import { toMillis } from "@/lib/firebase-utils";
import { normalizeEnrollmentMode } from "@/lib/enrollment";

export const BRANCHES_COLLECTION = "branches";

function normalizeSettings(data: unknown): BranchSettings | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = data as Record<string, unknown>;
  const serviceTimes = Array.isArray(raw.serviceTimes) ?
      raw.serviceTimes.map(String)
    : undefined;
  return {
    serviceTimes,
    parkingNotes: raw.parkingNotes ? String(raw.parkingNotes) : undefined,
    accessibilityNotes:
      raw.accessibilityNotes ? String(raw.accessibilityNotes) : undefined,
    enrollmentMode: normalizeEnrollmentMode(raw.enrollmentMode),
    joinUrlEnabled: raw.joinUrlEnabled !== false,
  };
}

export function normalizeBranchFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseBranch {
  return {
    id,
    organizationId: String(data.organizationId ?? "").trim(),
    churchId: String(data.churchId ?? "").trim(),
    name: String(data.name ?? "").trim(),
    slug: String(data.slug ?? "").trim(),
    description: String(data.description ?? "").trim() || undefined,
    address: String(data.address ?? "").trim() || undefined,
    city: String(data.city ?? "").trim() || undefined,
    state: String(data.state ?? "").trim() || undefined,
    country: String(data.country ?? "").trim() || undefined,
    phone: String(data.phone ?? "").trim() || undefined,
    email: String(data.email ?? "").trim() || undefined,
    isActive: data.isActive !== false,
    isDefault: data.isDefault === true,
    settings: normalizeSettings(data.settings),
    retiredJoinSlugs: Array.isArray(data.retiredJoinSlugs) ?
        data.retiredJoinSlugs.map(String).filter(Boolean)
      : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildBranchCreatePayload(input: CreateBranchInput) {
  const slug = slugifyChurchSlug(input.slug || input.name);
  if (!isValidChurchSlug(slug)) {
    throw new Error("Branch slug must be at least 2 characters.");
  }

  return {
    organizationId: input.organizationId.trim(),
    churchId: input.churchId.trim(),
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || "",
    address: input.address?.trim() || "",
    city: input.city?.trim() || "",
    state: input.state?.trim() || "",
    country: input.country?.trim() || "",
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    isActive: input.isActive !== false,
    isDefault: input.isDefault === true,
    settings: input.settings ?? {},
  };
}

export function buildBranchUpdatePayload(
  input: Partial<CreateBranchInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.slug !== undefined) {
    const slug = slugifyChurchSlug(input.slug);
    if (!isValidChurchSlug(slug)) throw new Error("Invalid branch slug.");
    payload.slug = slug;
  }
  if (input.description !== undefined) {
    payload.description = input.description.trim();
  }
  if (input.address !== undefined) payload.address = input.address.trim();
  if (input.city !== undefined) payload.city = input.city.trim();
  if (input.state !== undefined) payload.state = input.state.trim();
  if (input.country !== undefined) payload.country = input.country.trim();
  if (input.phone !== undefined) payload.phone = input.phone.trim();
  if (input.email !== undefined) payload.email = input.email.trim();
  if (input.isActive !== undefined) payload.isActive = input.isActive;
  if (input.isDefault !== undefined) payload.isDefault = input.isDefault;
  if (input.settings !== undefined) payload.settings = input.settings;
  if (input.retiredJoinSlugs !== undefined) {
    payload.retiredJoinSlugs = input.retiredJoinSlugs;
  }
  return payload;
}
