"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import { minorUnitsToAmount } from "@/lib/subscription/billing-eligibility";
import type { BillingReceiptRecord } from "@/types/billing-receipt";

function formatMoney(amountMinor: number, currency: string): string {
  const amount = minorUnitsToAmount(amountMinor, currency);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function authorizedFetch(path: string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Sign in again to view billing history.");
  const token = await user.getIdToken();
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export function useBillingReceipts(organizationId: string) {
  const [receipts, setReceipts] = useState<BillingReceiptRecord[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      setReceipts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authorizedFetch(
        `/api/subscription/invoices?organizationId=${encodeURIComponent(organizationId)}`
      );
      const body = (await response.json().catch(() => ({}))) as {
        receipts?: BillingReceiptRecord[];
        notice?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Billing history could not be loaded.");
      }
      const next = body.receipts ?? [];
      setReceipts(next);
      setNotice(body.notice ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Billing history could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { receipts, notice, error, loading, reload: load };
}

export function BillingHistory({
  organizationId,
}: {
  organizationId: string;
  onPaymentMethod?: (summary: string | null) => void;
}) {
  const { receipts, notice, error, loading, reload } = useBillingReceipts(organizationId);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function openReceipt(receipt: BillingReceiptRecord, download: boolean) {
    const preview = download ? null : window.open("", "_blank");
    if (!download && !preview) {
      setActionError("Allow pop-ups for this site to view the receipt.");
      return;
    }
    setOpeningId(receipt.id);
    setActionError(null);
    try {
      const response = await authorizedFetch(
        `/api/subscription/invoices/${encodeURIComponent(receipt.id)}?organizationId=${encodeURIComponent(organizationId)}&disposition=${download ? "attachment" : "inline"}`
      );
      if (!response.ok) {
        preview?.close();
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "This receipt could not be opened.");
      }
      const blob = new Blob([await response.arrayBuffer()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${receipt.receiptNumber}.pdf`;
        link.click();
      } else if (preview) {
        preview.location.href = url;
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadError) {
      preview?.close();
      setActionError(
        downloadError instanceof Error
          ? downloadError.message
          : "This receipt could not be opened."
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold">Billing history</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Payment receipts for confirmed charges. These are not tax invoices.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void reload()} disabled={loading}>
          Refresh
        </Button>
      </div>
      {notice ? (
        <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground sm:px-5">
          {notice}
        </p>
      ) : null}
      {loading ? (
        <div className="space-y-2 px-4 py-4 sm:px-5" aria-busy="true">
          <div className="h-8 animate-pulse rounded-md bg-muted" />
          <div className="h-8 animate-pulse rounded-md bg-muted" />
        </div>
      ) : null}
      {error || actionError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <p className="text-sm text-destructive" role="alert">
            {error ?? actionError}
          </p>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : null}
      {!loading && !error && receipts?.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
          No confirmed subscription payments yet. A receipt appears here after Razorpay records a paid charge.
        </p>
      ) : null}
      {!loading && receipts && receipts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4 sm:pl-5">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="pr-4 text-right sm:pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="pl-4 whitespace-nowrap text-muted-foreground sm:pl-5">
                  {formatDate(receipt.paidAt)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{receipt.description}</p>
                  {receipt.planId ? (
                    <p className="text-xs capitalize text-muted-foreground">{receipt.planId}</p>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(receipt.periodStart)} – {formatDate(receipt.periodEnd)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatMoney(receipt.amountMinor, receipt.currency)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium capitalize text-emerald-700 dark:text-emerald-300">
                    {receipt.status}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {receipt.receiptNumber}
                </TableCell>
                <TableCell className="pr-4 text-right sm:pr-5">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={openingId === receipt.id}
                      onClick={() => void openReceipt(receipt, false)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={openingId === receipt.id}
                      onClick={() => void openReceipt(receipt, true)}
                    >
                      Download
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
