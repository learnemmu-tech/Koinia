export const DONATION_CAMPAIGN_STATUSES = ["active", "inactive"] as const;

export type DonationCampaignStatus = (typeof DONATION_CAMPAIGN_STATUSES)[number];

export const DONATION_CURRENCIES = ["INR", "USD"] as const;

export type DonationCurrency = (typeof DONATION_CURRENCIES)[number];

export const PAYMENT_PROVIDERS = ["stripe", "razorpay"] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type FirebaseDonationCampaign = {
  id: string;
  churchId: string;
  organizationId?: string;
  branchId?: string | null;
  title: string;
  description: string;
  bannerImage?: string;
  targetAmount: number;
  currentAmount: number;
  currency: DonationCurrency;
  status: DonationCampaignStatus;
  createdAt: number;
  updatedAt: number;
};

export type FirebaseDonation = {
  id: string;
  churchId: string;
  organizationId?: string;
  branchId?: string | null;
  campaignId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: DonationCurrency;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProviderId;
  transactionId: string;
  isAnonymous: boolean;
  createdAt: number;
};

export type CreateDonationCampaignInput = {
  churchId: string;
  organizationId?: string;
  branchId?: string;
  title: string;
  description: string;
  bannerImage?: string;
  targetAmount: number;
  currency: DonationCurrency;
  status: DonationCampaignStatus;
};

export type UpdateDonationCampaignInput = Partial<CreateDonationCampaignInput>;

export type CreateDonationCheckoutInput = {
  campaignId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  isAnonymous: boolean;
};

export const SUGGESTED_DONATION_AMOUNTS_INR = [500, 1000, 2500, 5000] as const;
