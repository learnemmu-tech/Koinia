"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Heart, Loader2, Lock } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
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
  "h-12 rounded-xl border border-border/80 bg-background text-base text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-ring";

const labelClassName = "text-sm font-medium text-foreground/80";

type ChurchMethod = {
  method: "upi_qr" | "upi_id" | "bank_transfer";
  displayName: string;
  instructions: string;
  qrUrl?: string;
  upiId?: string;
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string;
  ifscCode?: string | null;
  branchName?: string;
};

export function DonateForm({ campaign }: DonateFormProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [methods, setMethods] = useState<ChurchMethod[]>([]);
  const [methodId, setMethodId] = useState<ChurchMethod["method"] | "">("");
  const [paymentReference, setPaymentReference] = useState("");
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [donorAcknowledgement, setDonorAcknowledgement] = useState("");
  const paysChurchDirectly = Boolean(campaign.churchId) && campaign.currency === "INR";

  useEffect(() => {
    if (!paysChurchDirectly) return;
    void fetch(`/api/donations/methods?campaignId=${encodeURIComponent(campaign.id)}`)
      .then((response) => response.json())
      .then((payload: unknown) => {
        const body = payload as { methods?: ChurchMethod[]; donorAcknowledgement?: string };
        const next = body.methods ?? [];
        setDonorAcknowledgement(body.donorAcknowledgement?.trim() ?? "");
        setMethods(next);
        setMethodId(next[0]?.method ?? "");
      })
      .catch(() => setMethods([]));
  }, [campaign.id, paysChurchDirectly]);

  const suggestedAmounts = useMemo(() => {
    if (campaign.currency === "INR") {
      return [...SUGGESTED_DONATION_AMOUNTS_INR];
    }
    return [25, 50, 100, 250];
  }, [campaign.currency]);

  const currencyPrefix = campaign.currency === "INR" ? "₹" : "$";

  const form = useForm<DonationCheckoutFormValues>({
    resolver: zodResolver(
      donationCheckoutFormSchema
    ) as Resolver<DonationCheckoutFormValues>,
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
      if (paysChurchDirectly) {
        if (!methodId) {
          throw new Error("This church has not enabled a donation method yet.");
        }
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        const response = await fetch("/api/donations/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaign.id,
            method: methodId,
            donorName: values.donorName,
            donorEmail: values.donorEmail,
            amount: values.amount,
            isAnonymous: values.isAnonymous,
            paymentReference,
            idempotencyKey,
          }),
        });
        const data = (await response.json()) as { error?: string; message?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not submit the donation.");
        setSubmittedStatus("awaiting_verification");
        toast.success(data.message ?? "Submitted for church verification.");
        return;
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto ?
          crypto.randomUUID()
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
        <div className="space-y-2.5">
          <FormLabel className={labelClassName}>Suggested amount</FormLabel>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                    "flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ?
                      "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-card text-foreground hover:border-primary/35 hover:bg-muted/30",
                    "disabled:cursor-not-allowed disabled:opacity-60"
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
              <FormLabel className={labelClassName}>
                Or enter custom amount
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
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

        {paysChurchDirectly ? (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <p className="text-sm font-semibold text-foreground">Pay the church directly</p>
            <p className="text-sm text-muted-foreground">
              Koinia does not receive this donation. Pay the church using one of its methods, then submit your reference. The church must verify it before it counts.
            </p>
            {methods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receiving method is enabled for this campaign.</p>
            ) : (
              methods.map((method) => (
                <label key={method.method} className="flex gap-3 rounded-xl border border-border/70 p-3">
                  <input
                    type="radio"
                    name="receiving-method"
                    checked={methodId === method.method}
                    onChange={() => setMethodId(method.method)}
                  />
                  <span className="space-y-1 text-sm">
                    <span className="block font-medium">{method.displayName}</span>
                    {method.upiId ? <span className="block">UPI ID: {method.upiId}</span> : null}
                    {method.qrUrl ? <img src={method.qrUrl} alt="Church UPI QR" className="h-36 w-36 rounded-md border" /> : null}
                    {method.accountNumber ? (
                      <span className="block">
                        {method.accountHolderName} · {method.bankName} · {method.accountNumber} · IFSC {method.ifscCode}
                        {method.branchName ? ` · ${method.branchName}` : ""}
                      </span>
                    ) : null}
                    {method.instructions ? <span className="block text-muted-foreground">{method.instructions}</span> : null}
                  </span>
                </label>
              ))
            )}
            <label className="block space-y-1 text-sm font-medium" htmlFor="payment-reference">
              Payment reference
              <Input
                id="payment-reference"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="UPI or bank reference"
                className={fieldClassName}
              />
            </label>
            {submittedStatus === "awaiting_verification" ? (
              <div className="space-y-1 rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">Submitted · awaiting verification</p>
                <p className="text-muted-foreground">This is not a completed payment. The church still has to verify the reference.</p>
                <p>
                  {donorAcknowledgement ||
                    "Thank you for your generous support. Your contribution helps our church continue its mission and serve our community."}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3.5 border-t border-border/60 pt-4">
          <p className="text-sm font-semibold text-foreground">Your details</p>

          {!isAnonymous ?
            <FormField
              control={form.control}
              name="donorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClassName}>Full name</FormLabel>
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
            name="donorEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClassName}>Email address</FormLabel>
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

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-border accent-primary"
                      checked={field.value}
                      disabled={processing}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Donate anonymously
                  </FormLabel>
                </div>
                <p className="pl-7 text-xs text-muted-foreground">
                  Your name will not be shared publicly.
                </p>
              </FormItem>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={processing}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground",
            "transition-colors hover:bg-[hsl(var(--primary-hover))]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-70"
          )}
        >
          {processing ?
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing…
            </>
          : <>
              <Heart className="size-4" aria-hidden />
              Donate {formatDonationAmount(buttonAmount, campaign.currency)}
              <ArrowRight className="size-4" aria-hidden />
            </>
          }
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Secure donation
        </p>
      </form>
    </Form>
  );
}
