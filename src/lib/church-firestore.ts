import type {
  CreateChurchInput,
  FirebaseChurch,
  ChurchSettings,
} from "@/types/firebase-church";

import { isValidChurchSlug, slugifyChurchSlug } from "./church-scope";
import { toMillis } from "./firebase-utils";

export const CHURCHES_COLLECTION = "churches";

function normalizeChurchSettings(data: unknown): ChurchSettings | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = data as Record<string, unknown>;
  return {
    defaultLanguage: raw.defaultLanguage ?
        String(raw.defaultLanguage)
      : undefined,
    showDonations: raw.showDonations !== false,
    showEvents: raw.showEvents !== false,
    showPrayerWall: raw.showPrayerWall !== false,
  };
}

export function normalizeChurchFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseChurch {
  const establishedRaw = data.establishedYear;
  const establishedYear =
    typeof establishedRaw === "number" && Number.isFinite(establishedRaw)
      ? establishedRaw
      : Number.parseInt(String(establishedRaw ?? ""), 10);

  const bannerUrl = String(data.bannerUrl ?? data.coverImage ?? "").trim();
  const coverImage = String(data.coverImage ?? data.bannerUrl ?? "").trim();

  return {
    id,
    organizationId: String(data.organizationId ?? "").trim() || undefined,
    name: String(data.name ?? "").trim(),
    slug: String(data.slug ?? "").trim(),
    description: String(data.description ?? "").trim() || undefined,
    logoUrl: String(data.logoUrl ?? "").trim() || undefined,
    bannerUrl: bannerUrl || undefined,
    coverImage: coverImage || undefined,
    address: String(data.address ?? "").trim() || undefined,
    city: String(data.city ?? "").trim() || undefined,
    state: String(data.state ?? "").trim() || undefined,
    country: String(data.country ?? "").trim() || undefined,
    phone: String(data.phone ?? "").trim() || undefined,
    email: String(data.email ?? "").trim() || undefined,
    website: String(data.website ?? "").trim() || undefined,
    pastorName: String(data.pastorName ?? "").trim() || undefined,
    establishedYear: Number.isFinite(establishedYear)
      ? establishedYear
      : undefined,
    timezone: String(data.timezone ?? "").trim() || undefined,
    currency: String(data.currency ?? "").trim() || undefined,
    denomination: String(data.denomination ?? "").trim() || undefined,
    churchType: String(data.churchType ?? "").trim() || undefined,
    defaultBranchId: String(data.defaultBranchId ?? "").trim() || undefined,
    settings: normalizeChurchSettings(data.settings),
    primaryColor: String(data.primaryColor ?? "").trim() || undefined,
    secondaryColor: String(data.secondaryColor ?? "").trim() || undefined,
    welcomeMessage: String(data.welcomeMessage ?? "").trim() || undefined,
    isActive: data.isActive !== false,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildChurchCreatePayload(input: CreateChurchInput) {
  const slug = slugifyChurchSlug(input.slug || input.name);
  if (!isValidChurchSlug(slug)) {
    throw new Error("Church slug must be at least 2 characters (a-z, 0-9, hyphens).");
  }

  const cover = input.coverImage?.trim() || input.bannerUrl?.trim() || "";

  return {
    organizationId: input.organizationId?.trim() || "",
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || "",
    logoUrl: input.logoUrl?.trim() || "",
    bannerUrl: cover,
    coverImage: cover,
    address: input.address?.trim() || "",
    city: input.city?.trim() || "",
    state: input.state?.trim() || "",
    country: input.country?.trim() || "",
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    website: input.website?.trim() || "",
    pastorName: input.pastorName?.trim() || "",
    establishedYear: input.establishedYear ?? null,
    timezone: input.timezone?.trim() || "",
    currency: input.currency?.trim() || "USD",
    denomination: input.denomination?.trim() || "",
    churchType: input.churchType?.trim() || "",
    defaultBranchId: input.defaultBranchId?.trim() || "",
    settings: input.settings ?? {},
    primaryColor: input.primaryColor?.trim() || "",
    secondaryColor: input.secondaryColor?.trim() || "",
    welcomeMessage: input.welcomeMessage?.trim() || "",
    isActive: input.isActive !== false,
  };
}

export function buildChurchUpdatePayload(
  input: Partial<CreateChurchInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.slug !== undefined) {
    const slug = slugifyChurchSlug(input.slug);
    if (!isValidChurchSlug(slug)) {
      throw new Error("Invalid church slug.");
    }
    payload.slug = slug;
  }
  if (input.description !== undefined) {
    payload.description = input.description.trim();
  }
  if (input.logoUrl !== undefined) payload.logoUrl = input.logoUrl.trim();
  if (input.bannerUrl !== undefined) {
    payload.bannerUrl = input.bannerUrl.trim();
    payload.coverImage = input.bannerUrl.trim();
  }
  if (input.coverImage !== undefined) {
    payload.coverImage = input.coverImage.trim();
    payload.bannerUrl = input.coverImage.trim();
  }
  if (input.organizationId !== undefined) {
    payload.organizationId = input.organizationId.trim();
  }
  if (input.timezone !== undefined) payload.timezone = input.timezone.trim();
  if (input.currency !== undefined) payload.currency = input.currency.trim();
  if (input.settings !== undefined) payload.settings = input.settings;
  if (input.address !== undefined) payload.address = input.address.trim();
  if (input.city !== undefined) payload.city = input.city.trim();
  if (input.state !== undefined) payload.state = input.state.trim();
  if (input.country !== undefined) payload.country = input.country.trim();
  if (input.denomination !== undefined) {
    payload.denomination = input.denomination.trim();
  }
  if (input.churchType !== undefined) {
    payload.churchType = input.churchType.trim();
  }
  if (input.phone !== undefined) payload.phone = input.phone.trim();
  if (input.email !== undefined) payload.email = input.email.trim();
  if (input.website !== undefined) payload.website = input.website.trim();
  if (input.pastorName !== undefined) payload.pastorName = input.pastorName.trim();
  if (input.establishedYear !== undefined) {
    payload.establishedYear = input.establishedYear;
  }
  if (input.primaryColor !== undefined) {
    payload.primaryColor = input.primaryColor.trim();
  }
  if (input.secondaryColor !== undefined) {
    payload.secondaryColor = input.secondaryColor.trim();
  }
  if (input.welcomeMessage !== undefined) {
    payload.welcomeMessage = input.welcomeMessage.trim();
  }
  if (input.isActive !== undefined) payload.isActive = input.isActive;

  return payload;
}
