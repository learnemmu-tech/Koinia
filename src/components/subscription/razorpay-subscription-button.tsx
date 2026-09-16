"use client";

import { useState } from "react";
import { toast } from "sonner";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { PlanId } from "@/types/subscription";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type RazorpayCheckout = {
  open: () => void;
  on?: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayPaymentFailedResponse = {
  error?: {
    description?: string;
    reason?: string;
    metadata?: { subscription_id?: string };
  };
};

type RazorpaySubscriptionButtonProps = {
  planId: Extract<PlanId, "starter" | "professional">;
  label?: string;
  onComplete?: () => void;
};

type CreateResponse = {
  mode?: "checkout" | "scheduled_change";
  key?: string;
  subscriptionId?: string;
  planId?: PlanId;
  message?: string;
  error?: string;
};

async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpaySubscriptionButton({
  planId,
  label = "Start Subscription",
  onComplete,
}: RazorpaySubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function startSubscription() {
    const user = firebaseAuth.currentUser;
    if (!user) {
      toast.error("Please sign in before starting a subscription.");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/razorpay/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      const data = (await response.json()) as CreateResponse;
      if (!response.ok) throw new Error(data.error ?? "Unable to start subscription.");

      if (data.mode === "scheduled_change") {
        toast.success(data.message ?? "Plan change scheduled.");
        onComplete?.();
        return;
      }
      if (!data.key || !data.subscriptionId) {
        throw new Error("Subscription checkout is not configured.");
      }
      if (!(await loadRazorpayScript()) || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout.");
      }
      const checkoutSubscriptionId = data.subscriptionId;

      await new Promise<void>((resolve, reject) => {
        let cleanupStarted = false;
        const releaseCheckout = async ({
          endpoint,
          reason,
          subscriptionId,
        }: {
          endpoint: "/api/subscription/razorpay/failure" | "/api/subscription/razorpay/abandon";
          reason: string;
          subscriptionId: string;
        }) => {
          if (cleanupStarted) return;
          cleanupStarted = true;
          try {
            const cleanupUser = firebaseAuth.currentUser;
            if (!cleanupUser) {
              throw new Error("Authenticated user is no longer available.");
            }
            const cleanupToken = await cleanupUser.getIdToken(true);
            const cleanupResponse = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${cleanupToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ subscriptionId }),
            });
            const cleanupData = (await cleanupResponse.json().catch(() => ({}))) as {
              failed?: boolean;
              abandoned?: boolean;
              organizationId?: string;
              state?: string;
            };
            const transitioned = cleanupData.failed === true || cleanupData.abandoned === true;
            if (!cleanupResponse.ok || !transitioned) {
              console.error("[razorpay checkout cleanup]", {
                organizationId: cleanupData.organizationId ?? "unknown",
                subscriptionId,
                httpStatus: cleanupResponse.status,
                failureReason: reason,
                state: cleanupData.state ?? "not_transitioned",
              });
            }
          } catch (error) {
            console.error("[razorpay checkout cleanup]", {
              organizationId: "unknown",
              subscriptionId,
              httpStatus: 0,
              failureReason: reason,
              state: "request_failed",
              error: error instanceof Error ? error.message : "request failed",
            });
          }
        };
        const razorpay = new window.Razorpay!({
          key: data.key,
          subscription_id: data.subscriptionId,
          name: "FaithConnectHub",
          description: `${planId === "starter" ? "Starter" : "Professional"} subscription`,
          prefill: {
            email: user.email ?? undefined,
          },
          theme: { color: "#1f6f78" },
          handler: async (checkoutResponse: {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyResponse = await fetch("/api/subscription/razorpay/verify", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentId: checkoutResponse.razorpay_payment_id,
                  subscriptionId: checkoutResponse.razorpay_subscription_id,
                  signature: checkoutResponse.razorpay_signature,
                }),
              });
              const verifyData = (await verifyResponse.json()) as { error?: string };
              if (!verifyResponse.ok) {
                throw new Error(verifyData.error ?? "Subscription verification failed.");
              }
              toast.success("Subscription authorization verified.");
              onComplete?.();
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: async () => {
              await releaseCheckout({
                endpoint: "/api/subscription/razorpay/abandon",
                reason: "modal_dismissed",
                subscriptionId: checkoutSubscriptionId,
              });
              reject(new Error("Subscription checkout cancelled."));
            },
          },
        }) as RazorpayCheckout;
        razorpay.on?.("payment.failed", async (rawResponse) => {
          const failureResponse = rawResponse as RazorpayPaymentFailedResponse;
          const failedSubscriptionId =
            failureResponse.error?.metadata?.subscription_id ?? checkoutSubscriptionId;
          await releaseCheckout({
            endpoint: "/api/subscription/razorpay/failure",
            reason:
              failureResponse.error?.description ??
              failureResponse.error?.reason ??
              "payment.failed",
            subscriptionId: failedSubscriptionId,
          });
          reject(new Error("Payment could not be completed."));
        });
        razorpay.open();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startSubscription()}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? "Opening checkout..." : label}
    </button>
  );
}

export function CancelRazorpaySubscriptionButton({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function cancelSubscription() {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/subscription/razorpay/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to cancel subscription.");
      toast.success("Your subscription will end at the current billing period.");
      onComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void cancelSubscription()}
      disabled={loading}
      className="text-sm font-medium text-destructive underline underline-offset-4 disabled:opacity-50"
    >
      {loading ? "Cancelling..." : "Cancel subscription"}
    </button>
  );
}
