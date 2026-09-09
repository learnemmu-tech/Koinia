import { z } from "zod";

import { ISO_CURRENCIES } from "@/lib/books/currency";

const isoCurrency = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => (ISO_CURRENCIES as readonly string[]).includes(value), {
    message: "Currency must be a supported ISO 4217 code.",
  });

const isoCountry = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Country must be an ISO 3166-1 alpha-2 code.");

export const bookTypeSchema = z.enum(["digital", "physical", "both"]);
export const bookStatusSchema = z.enum(["draft", "published", "archived"]);
export const bookVisibilitySchema = z.enum(["public", "members_only"]);
export const digitalAccessModeSchema = z.enum(["free", "paid"]);
export const fulfillmentStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const digitalEditionInputSchema = z.object({
  accessMode: digitalAccessModeSchema,
  priceCents: z.number().int().min(0).max(99_999_999),
  currency: isoCurrency,
});

export const physicalEditionInputSchema = z.object({
  priceCents: z.number().int().min(0).max(99_999_999),
  currency: isoCurrency,
  stockQuantity: z.number().int().min(0).max(1_000_000),
  sku: z.string().trim().max(80).optional().nullable(),
  weightGrams: z.number().int().min(0).max(1_000_000).optional().nullable(),
  shippingAvailable: z.boolean(),
  isActive: z.boolean(),
});

export const upsertBookSchema = z
  .object({
    churchId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    authorName: z.string().trim().min(1).max(160),
    description: z.string().trim().max(20000).default(""),
    language: z.string().trim().min(2).max(16),
    currency: isoCurrency,
    status: bookStatusSchema,
    visibility: bookVisibilitySchema,
    bookType: bookTypeSchema,
    slug: z
      .string()
      .trim()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase hyphenated slug.")
      .optional(),
    digital: digitalEditionInputSchema.optional().nullable(),
    physical: physicalEditionInputSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.bookType === "digital" || value.bookType === "both") {
      if (!value.digital) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["digital"],
          message: "Digital edition details are required.",
        });
      } else if (value.digital.accessMode === "paid" && value.digital.priceCents <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["digital", "priceCents"],
          message: "Paid digital editions need a price greater than zero.",
        });
      }
    }
    if (value.bookType === "physical" || value.bookType === "both") {
      if (!value.physical) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["physical"],
          message: "Physical edition details are required.",
        });
      }
    }
  });

export const createPhysicalOrderSchema = z.object({
  quantity: z.number().int().min(1).max(99).default(1),
  shippingName: z.string().trim().min(1).max(160),
  shippingPhone: z.string().trim().min(4).max(40),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(32),
  country: isoCountry,
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateFulfillmentSchema = z
  .object({
    fulfillmentStatus: fulfillmentStatusSchema,
    trackingNumber: z.string().trim().max(120).optional().nullable(),
    trackingUrl: z
      .string()
      .trim()
      .url()
      .max(500)
      .optional()
      .nullable()
      .or(z.literal("")),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillmentStatus === "shipped") {
      if (!value.trackingNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trackingNumber"],
          message: "Tracking number is required when marking an order shipped.",
        });
      }
    }
  });

export type UpsertBookInput = z.infer<typeof upsertBookSchema>;
export type CreatePhysicalOrderInput = z.infer<typeof createPhysicalOrderSchema>;
export type UpdateFulfillmentInput = z.infer<typeof updateFulfillmentSchema>;
