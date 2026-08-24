import * as z from "zod";

import type { PrayerRequestCategory } from "@/types/firebase-prayer-request";

export const PRAYER_TITLE_MAX = 100;
export const PRAYER_REQUEST_MAX = 1000;
export const PRAYER_NAME_MAX = 80;

export const PRAYER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "health", label: "Health & Healing" },
  { value: "family", label: "Family" },
  { value: "finances", label: "Finances" },
  { value: "salvation", label: "Salvation" },
  { value: "guidance", label: "Guidance" },
  { value: "thanksgiving", label: "Thanksgiving" },
  { value: "other", label: "Other" },
] as const satisfies ReadonlyArray<{
  value: PrayerRequestCategory;
  label: string;
}>;

const prayerCategorySchema = z.enum([
  "general",
  "health",
  "family",
  "finances",
  "salvation",
  "guidance",
  "thanksgiving",
  "other",
]);

function stripControlCharacters(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    if (isAllowedWhitespace || (code >= 32 && code !== 127)) {
      result += char;
    }
  }
  return result;
}

export function sanitizePrayerText(value: string, maxLength: number): string {
  return stripControlCharacters(value.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export const prayerRequestSubmitSchema = z.object({
  name: z
    .string()
    .max(PRAYER_NAME_MAX, `Name must be at most ${PRAYER_NAME_MAX} characters`),
  email: z
    .string()
    .email("Please enter a valid email")
    .max(120)
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .min(1, "Prayer title is required")
    .max(PRAYER_TITLE_MAX, `Title must be at most ${PRAYER_TITLE_MAX} characters`),
  request: z
    .string()
    .min(1, "Prayer request is required")
    .max(
      PRAYER_REQUEST_MAX,
      `Prayer request must be at most ${PRAYER_REQUEST_MAX} characters`
    ),
  category: prayerCategorySchema,
  isAnonymous: z.boolean(),
  shareWithCommunity: z.boolean(),
});

export type PrayerRequestSubmitValues = z.infer<typeof prayerRequestSubmitSchema>;

export function sanitizePrayerRequestInput(
  values: PrayerRequestSubmitValues
): PrayerRequestSubmitValues {
  return {
    name: sanitizePrayerText(values.name, PRAYER_NAME_MAX),
    email: values.email ? sanitizePrayerText(values.email, 120) : undefined,
    title: sanitizePrayerText(values.title, PRAYER_TITLE_MAX),
    request: sanitizePrayerText(values.request, PRAYER_REQUEST_MAX),
    category: values.category,
    isAnonymous: values.isAnonymous,
    shareWithCommunity: values.shareWithCommunity,
  };
}

export function getPrayerCategoryLabel(category?: PrayerRequestCategory): string {
  const match = PRAYER_CATEGORIES.find((item) => item.value === category);
  return match?.label ?? "General";
}
