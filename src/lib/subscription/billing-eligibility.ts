export const AWAITING_PROVIDER_CHARGE = new Set([
  "created",
  "authenticated",
  "pending",
]);

const TERMINAL_PROVIDER_STATUSES = new Set([
  "cancelled",
  "completed",
  "expired",
  "failed",
  "abandoned",
]);

/** Paid access from Razorpay's own subscription record. */
export function razorpaySubscriptionIsActive(input: {
  status: string;
  currentEnd: Date | null;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  return (
    input.status.toLowerCase() === "active" &&
    input.currentEnd != null &&
    input.currentEnd.getTime() > now
  );
}

/**
 * A captured Razorpay invoice can confirm the first charge while the
 * subscription entity is still moving to active. Terminal subscriptions
 * never qualify.
 */
export function chargeConfirmsPaidAccess(input: {
  status: string;
  currentEnd: Date | null;
  hasPaidCharge: boolean;
  now?: number;
}): boolean {
  if (razorpaySubscriptionIsActive(input)) return true;
  if (!input.hasPaidCharge || input.currentEnd == null) return false;
  if (input.currentEnd.getTime() <= (input.now ?? Date.now())) return false;
  const status = input.status.toLowerCase();
  if (TERMINAL_PROVIDER_STATUSES.has(status)) return false;
  return AWAITING_PROVIDER_CHARGE.has(status);
}

export function periodEndFromPlan(
  start: Date,
  period: string,
  interval: number
): Date {
  const count = Number.isInteger(interval) && interval > 0 ? interval : 1;
  const end = new Date(start.getTime());
  const normalized = period.trim().toLowerCase();
  if (normalized === "yearly" || normalized === "year") {
    end.setUTCFullYear(end.getUTCFullYear() + count);
  } else if (normalized === "weekly" || normalized === "week") {
    end.setUTCDate(end.getUTCDate() + 7 * count);
  } else if (normalized === "daily" || normalized === "day") {
    end.setUTCDate(end.getUTCDate() + count);
  } else {
    end.setUTCMonth(end.getUTCMonth() + count);
  }
  return end;
}

export function billingIntervalFromPeriod(
  period: string
): "monthly" | "yearly" {
  const normalized = period.trim().toLowerCase();
  return normalized === "yearly" || normalized === "year" ? "yearly" : "monthly";
}

export function receiptNumberForPayment(paymentId: string, paidAt: Date): string {
  const year = paidAt.getUTCFullYear();
  const suffix = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `FCH-R-${year}-${suffix || "PAYMENT"}`;
}

/** Unix start time for a replacement plan, or too_soon when Razorpay would reject start_at. */
export function deferredSubscriptionStart(
  periodEnd: Date | null,
  now = Date.now()
): number | "too_soon" | null {
  if (!periodEnd || periodEnd.getTime() <= now) return null;
  if (periodEnd.getTime() < now + 16 * 60 * 1000) return "too_soon";
  return Math.floor(periodEnd.getTime() / 1000);
}

export function minorUnitsToAmount(amountMinor: number, currency: string): number {
  const code = currency.trim().toUpperCase();
  const zeroDecimal = new Set(["JPY", "KRW"]);
  return zeroDecimal.has(code) ? amountMinor : amountMinor / 100;
}
