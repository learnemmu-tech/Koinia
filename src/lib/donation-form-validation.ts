import { z } from "zod";

import {
  DONATION_CAMPAIGN_STATUSES,
  DONATION_CURRENCIES,
  SUGGESTED_DONATION_AMOUNTS_INR,
} from "@/types/firebase-donation";

export const donationCampaignFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Campaign title is required.")
    .min(3, "Campaign title must be at least 3 characters."),
  description: z.string().trim().min(1, "Description is required."),
  targetAmount: z.coerce
    .number({ invalid_type_error: "Target amount must be a number." })
    .positive("Target amount must be greater than zero."),
  currency: z.enum(DONATION_CURRENCIES),
  status: z.enum(DONATION_CAMPAIGN_STATUSES),
});

export type DonationCampaignFormValues = z.infer<
  typeof donationCampaignFormSchema
>;

export const donationCheckoutFormSchema = z
  .object({
    donorName: z.string().trim(),
    donorEmail: z
      .string()
      .trim()
      .email("Please enter a valid email address."),
    amount: z.coerce
      .number({ invalid_type_error: "Amount must be a number." })
      .positive("Donation amount must be greater than zero."),
    isAnonymous: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.isAnonymous && values.donorName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required unless donating anonymously.",
        path: ["donorName"],
      });
    }
  });

export type DonationCheckoutFormValues = z.infer<
  typeof donationCheckoutFormSchema
>;

export const donationCheckoutApiSchema = z
  .object({
    campaignId: z.string().trim().min(1, "Campaign is required."),
    donorName: z.string().trim(),
    donorEmail: z
      .string()
      .trim()
      .email("Please enter a valid email address."),
    amount: z.coerce
      .number({ invalid_type_error: "Amount must be a number." })
      .positive("Donation amount must be greater than zero."),
    isAnonymous: z.boolean(),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.isAnonymous && values.donorName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required unless donating anonymously.",
        path: ["donorName"],
      });
    }
  });

export type DonationCheckoutApiInput = z.infer<typeof donationCheckoutApiSchema>;

export function isSuggestedDonationAmount(amount: number): boolean {
  return SUGGESTED_DONATION_AMOUNTS_INR.includes(
    amount as (typeof SUGGESTED_DONATION_AMOUNTS_INR)[number]
  );
}
