import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import type { OrganizationSettings } from "@/types/organization";

export type BillingProfile = {
  legalName: string;
  contactName: string;
  email: string;
  address: string;
  country: string;
  taxId: string;
  organizationName: string;
};

const EMPTY: BillingProfile = {
  legalName: "",
  contactName: "",
  email: "",
  address: "",
  country: "",
  taxId: "",
  organizationName: "",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function getBillingProfile(organizationId: string): Promise<BillingProfile> {
  const [row] = await db
    .select({ name: organizations.name, settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  const settings = (row?.settings ?? {}) as OrganizationSettings;
  return {
    legalName: text(settings.billingLegalName),
    contactName: text(settings.billingContactName),
    email: text(settings.billingEmail || settings.email),
    address: text(settings.billingAddress || settings.address),
    country: text(settings.billingCountry || settings.country),
    taxId: text(settings.billingTaxId),
    organizationName: row?.name ?? "",
  };
}

export async function saveBillingProfile(
  organizationId: string,
  input: Omit<BillingProfile, "organizationName">
): Promise<BillingProfile> {
  const [current] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  const settings = {
    ...((current?.settings ?? {}) as OrganizationSettings),
    billingLegalName: input.legalName.trim(),
    billingContactName: input.contactName.trim(),
    billingEmail: input.email.trim(),
    billingAddress: input.address.trim(),
    billingCountry: input.country.trim(),
    billingTaxId: input.taxId.trim(),
  };
  await db
    .update(organizations)
    .set({ settings, updatedAt: new Date() })
    .where(eq(organizations.id, organizationId));
  return getBillingProfile(organizationId);
}

export function missingBillingFields(profile: BillingProfile): string[] {
  const missing: string[] = [];
  if (!profile.legalName && !profile.organizationName) missing.push("Organization legal name");
  if (!profile.email) missing.push("Billing email");
  if (!profile.address) missing.push("Billing address");
  if (!profile.country) missing.push("Country");
  if (!profile.taxId) missing.push("Tax registration");
  missing.push("Seller legal name and address are not configured");
  return missing;
}

export { EMPTY };
