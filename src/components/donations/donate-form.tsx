"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import { SUGGESTED_DONATION_AMOUNTS_INR } from "@/types/firebase-donation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  donationCheckoutFormSchema,
  type DonationCheckoutFormValues,
} from "@/lib/donation-form-validation";
import { formatDonationAmount } from "@/lib/donation-firestore";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type DonateFormProps = {
  campaign: FirebaseDonationCampaign;
};

type CheckoutResponse = {
  donationId: string;
  provider: "stripe" | "razorpay";
  checkoutUrl?: string;
  sessionId?: string;
  orderId?: string;
  publicKey?: string;
  amount: number;
  currency: string;
  campaignTitle: string;
  error?: string;
};

export function DonateForm({ campaign }: DonateFormProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const suggestedAmounts = useMemo(() => {
    if (campaign.currency === "INR") {
      return [...SUGGESTED_DONATION_AMOUNTS_INR];
    }
    return [25, 50, 100, 250];
  }, [campaign.currency]);

  const form = useForm<DonationCheckoutFormValues>({
    resolver: zodResolver(donationCheckoutFormSchema),
    defaultValues: {
      donorName: "",
      donorEmail: "",
      amount: 0,
      isAnonymous: false,
    },
  });

  const isAnonymous = form.watch("isAnonymous");

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

  async function openRazorpayCheckout(data: CheckoutResponse) {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay || !data.publicKey || !data.orderId) {
      throw new Error("Unable to load Razorpay checkout.");
    }

    const values = form.getValues();

    await new Promise<void>((resolve, reject) => {
      const razorpay = new window.Razorpay!({
        key: data.publicKey,
        amount: Math.round(data.amount * 100),
        currency: data.currency,
        name: "FaithConnectHub",
        description: data.campaignTitle,
        order_id: data.orderId,
        prefill: {
          name: values.isAnonymous ? "Anonymous" : values.donorName,
          email: values.donorEmail,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch("/api/donations/verify-razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                donationId: data.donationId,
                campaignId: campaign.id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: data.amount,
                currency: data.currency,
              }),
            });

            if (!verifyResponse.ok) {
              const payload = (await verifyResponse.json()) as { error?: string };
              throw new Error(payload.error ?? "Payment verification failed.");
            }

            window.location.href = `/donations/success?donationId=${encodeURIComponent(data.donationId)}`;
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled.")),
        },
      });

      razorpay.open();
    });
  }

  async function onSubmit(values: DonationCheckoutFormValues) {
    setProcessing(true);

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const response = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          donorName: values.donorName,
          donorEmail: values.donorEmail,
          amount: values.amount,
          isAnonymous: values.isAnonymous,
          idempotencyKey,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start donation checkout.");
      }

      if (data.provider === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.provider === "razorpay") {
        await openRazorpayCheckout(data);
        return;
      }

      throw new Error("Unsupported payment provider.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to process donation."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <FormLabel>Suggested Amount</FormLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {suggestedAmounts.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount ? "default" : "outline"}
                disabled={processing}
                onClick={() => {
                  setSelectedAmount(amount);
                  form.setValue("amount", amount, { shouldValidate: true });
                }}
              >
                {formatDonationAmount(amount, campaign.currency)}
              </Button>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Enter amount"
                  disabled={processing}
                  value={field.value || ""}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    field.onChange(next);
                    setSelectedAmount(null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="donorEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  disabled={processing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAnonymous ?
          <FormField
            control={form.control}
            name="donorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    disabled={processing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        : null}

        <FormField
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border/50 px-3 py-3">
              <FormControl>
                <input
                  type="checkbox"
                  className="size-4 rounded border border-input"
                  checked={field.value}
                  disabled={processing}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              </FormControl>
              <FormLabel className="font-normal">Donate anonymously</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={processing}>
          {processing ?
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing…
            </>
          : "Donate"}
        </Button>
      </form>
    </Form>
  );
}
