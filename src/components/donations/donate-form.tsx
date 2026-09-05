"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import { SUGGESTED_DONATION_AMOUNTS_INR } from "@/types/firebase-donation";

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
import { cn } from "@/lib/utils";

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

const fieldClassName =
  "h-12 rounded-[10px] border border-border bg-background text-base text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring";

const labelClassName = "text-sm font-medium text-muted-foreground";

export function DonateForm({ campaign }: DonateFormProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const suggestedAmounts = useMemo(() => {
    if (campaign.currency === "INR") {
      return [...SUGGESTED_DONATION_AMOUNTS_INR];
    }
    return [25, 50, 100, 250];
  }, [campaign.currency]);

  const currencyPrefix = campaign.currency === "INR" ? "₹" : "$";

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
  const amountValue = form.watch("amount");
  const buttonAmount =
    amountValue > 0 ? amountValue : (selectedAmount ?? suggestedAmounts[0] ?? 0);

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
        <div className="space-y-3">
          <FormLabel className={labelClassName}>Suggested Amount</FormLabel>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {suggestedAmounts.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setSelectedAmount(amount);
                    form.setValue("amount", amount, { shouldValidate: true });
                  }}
                  className={cn(
                    "flex h-[52px] items-center justify-center rounded-[10px] border text-base font-bold transition-all duration-200",
                    isSelected ?
                      "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-accent text-foreground hover:border-border hover:bg-card"
                  )}
                >
                  {formatDonationAmount(amount, campaign.currency)}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClassName}>Or enter custom amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                    {currencyPrefix}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Enter amount"
                    disabled={processing}
                    className={cn(fieldClassName, "pl-8")}
                    value={field.value || ""}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      field.onChange(next);
                      setSelectedAmount(null);
                    }}
                  />
                </div>
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
              <FormLabel className={labelClassName}>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  disabled={processing}
                  className={fieldClassName}
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
                <FormLabel className={labelClassName}>Your Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    disabled={processing}
                    className={fieldClassName}
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
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  className="size-4 rounded border border-border accent-white"
                  checked={field.value}
                  disabled={processing}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal text-muted-foreground">
                Donate anonymously
              </FormLabel>
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={processing}
          className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {processing ?
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing…
            </>
          : `Donate ${formatDonationAmount(buttonAmount, campaign.currency)} →`}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Secure donation
        </p>
      </form>
    </Form>
  );
}
