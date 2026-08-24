import type { DonationCurrency, PaymentProviderId } from "@/types/firebase-donation";

export type CreateCheckoutParams = {
  donationId: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  currency: DonationCurrency;
  donorName: string;
  donorEmail: string;
  isAnonymous: boolean;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult = {
  provider: PaymentProviderId;
  sessionId: string;
  checkoutUrl: string;
  publicKey?: string;
  orderId?: string;
};

export type VerifiedPaymentEvent = {
  provider: PaymentProviderId;
  transactionId: string;
  donationId: string;
  campaignId: string;
  amount: number;
  currency: DonationCurrency;
  status: "completed" | "failed" | "cancelled";
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  isConfigured(): boolean;
  createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult>;
  verifyWebhook(
    payload: string,
    signature: string | null
  ): Promise<VerifiedPaymentEvent | null>;
}
