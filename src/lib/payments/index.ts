import type { PaymentProviderId } from "@/types/firebase-donation";

import { RazorpayPaymentProvider } from "./razorpay-provider";
import { StripePaymentProvider } from "./stripe-provider";
import type { PaymentProvider } from "./types";

export type { PaymentProvider } from "./types";
export type { PaymentProviderId };
export type {
  CheckoutSessionResult,
  CreateCheckoutParams,
  VerifiedPaymentEvent,
} from "./types";

const providers: Record<PaymentProviderId, PaymentProvider> = {
  stripe: new StripePaymentProvider(),
  razorpay: new RazorpayPaymentProvider(),
};

export function getConfiguredPaymentProvider(): PaymentProvider {
  const preferred = (process.env.PAYMENT_PROVIDER?.trim().toLowerCase() ||
    "stripe") as PaymentProviderId;

  const preferredProvider = providers[preferred];
  if (preferredProvider?.isConfigured()) {
    return preferredProvider;
  }

  const fallback = Object.values(providers).find((provider) =>
    provider.isConfigured()
  );

  if (!fallback) {
    throw new Error(
      "No payment provider is configured. Set Stripe or Razorpay credentials."
    );
  }

  return fallback;
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  return providers[id];
}
