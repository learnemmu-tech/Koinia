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
    code?: string;
    source?: string;
    step?: string;
    reason?: string;
    description?: string;
    field?: string;
    metadata?: Record<string, string> & {
      subscription_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpaySubscriptionButtonProps = {
  planId: Extract<PlanId, "starter" | "professional">;
  label?: string;
  onComplete?: () => void;
};

type CheckoutPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

type CreateResponse = {
  mode?: "checkout" | "scheduled_change";
  key?: string;
  subscriptionId?: string;
  planId?: PlanId;
  prefill?: CheckoutPrefill;
  message?: string;
  error?: string;
};

type CleanupResponse = {
  failed?: boolean;
  abandoned?: boolean;
  organizationId?: string;
  state?: string;
  error?: string;
};

async function postCheckoutCleanup(
  endpoint: "/api/subscription/razorpay/failure" | "/api/subscription/razorpay/abandon",
  token: string,
  subscriptionId: string,
  diagnostics?: RazorpayPaymentFailedResponse["error"]
): Promise<{ ok: boolean; status: number; data: CleanupResponse }> {
  const cleanupResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscriptionId,
      ...(endpoint.endsWith("/failure") && diagnostics
        ? {
            diagnostics: {
              code: diagnostics.code,
              source: diagnostics.source,
              step: diagnostics.step,
              reason: diagnostics.reason,
              description: diagnostics.description,
              field: diagnostics.field,
              subscriptionId: diagnostics.metadata?.subscription_id ?? subscriptionId,
              paymentId: diagnostics.metadata?.payment_id,
              metadata: diagnostics.metadata,
            },
          }
        : {}),
    }),
  });
  const data = (await cleanupResponse.json().catch(() => ({}))) as CleanupResponse;
  return { ok: cleanupResponse.ok, status: cleanupResponse.status, data };
}

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
          diagnostics,
        }: {
          endpoint: "/api/subscription/razorpay/failure" | "/api/subscription/razorpay/abandon";
          reason: string;
          subscriptionId: string;
          diagnostics?: RazorpayPaymentFailedResponse["error"];
        }) => {
          if (cleanupStarted) return;
          cleanupStarted = true;
          try {
            const cleanupUser = firebaseAuth.currentUser;
            if (!cleanupUser) {
              throw new Error("Authenticated user is no longer available.");
            }
            let lastStatus = 0;
            let lastState = "request_failed";
            let lastError = "";
            for (let attempt = 0; attempt < 3; attempt += 1) {
              const cleanupToken = await cleanupUser.getIdToken(attempt > 0);
              const result = await postCheckoutCleanup(
                endpoint,
                cleanupToken,
                subscriptionId,
                diagnostics
              );
              lastStatus = result.status;
              lastState = result.data.state ?? "not_transitioned";
              lastError = result.data.error ?? "";
              const transitioned =
                result.data.failed === true || result.data.abandoned === true;
              if (result.ok && transitioned) return;
              const retryable = result.status >= 500 || result.status === 0;
              if (!retryable || attempt === 2) break;
              await new Promise((resolve) =>
                setTimeout(resolve, 400 * (attempt + 1))
              );
            }
            console.warn(
              `[razorpay checkout cleanup] ${reason} subscription=${subscriptionId} http=${lastStatus} state=${lastState}${lastError ? ` error=${lastError}` : ""}`
            );
          } catch (error) {
            console.warn(
              `[razorpay checkout cleanup] ${reason} subscription=${subscriptionId} request failed: ${
                error instanceof Error ? error.message : "request failed"
              }`
            );
          }
        };
        const razorpay = new window.Razorpay!({
          key: data.key,
          subscription_id: data.subscriptionId,
          name: "FaithConnectHub",
          description: `${planId === "starter" ? "Starter" : "Professional"} subscription`,
          prefill: {
            name: data.prefill?.name || user.displayName || undefined,
            email: data.prefill?.email || user.email || undefined,
            ...(data.prefill?.contact ? { contact: data.prefill.contact } : {}),
          },
          notes: {
            planId,
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
          const error = failureResponse.error;
          const failedSubscriptionId =
            error?.metadata?.subscription_id ?? checkoutSubscriptionId;
          await releaseCheckout({
            endpoint: "/api/subscription/razorpay/failure",
            reason:
              error?.description ??
              error?.reason ??
              error?.code ??
              "payment.failed",
            subscriptionId: failedSubscriptionId,
            diagnostics: error,
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
