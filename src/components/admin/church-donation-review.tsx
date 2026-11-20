"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  decideChurchDonation,
  loadChurchDonationReport,
  recordOfflineChurchDonation,
} from "@/lib/donations/church-receiving-actions";
import {
  offlineKeyAfterResult,
  offlineSubmissionKey,
} from "@/lib/donations/offline-submission";

type Report = Awaited<ReturnType<typeof loadChurchDonationReport>>;

export function ChurchDonationReview({ churchId }: { churchId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [donorName, setDonorName] = useState("");
  const offlineKey = useRef("");
  const [savingOffline, setSavingOffline] = useState(false);

  async function refresh() {
    const next = await loadChurchDonationReport({ churchId });
    setReport(next);
  }

  async function offline() {
    if (savingOffline) return;
    const key = offlineSubmissionKey(offlineKey.current, () => crypto.randomUUID());
    offlineKey.current = key;
    setSavingOffline(true);
    let succeeded = false;
    try {
      await recordOfflineChurchDonation({
        churchId,
        campaignId,
        amount: Number(amount),
        donatedOn: date,
        donorName,
        idempotencyKey: key,
      });
      succeeded = true;
      toast.success("Offline donation recorded. It is marked as admin-recorded, not an electronic payment.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the donation.");
    } finally {
      offlineKey.current = offlineKeyAfterResult(key, succeeded);
      setSavingOffline(false);
    }
  }

  async function decide(donationId: string, decision: "verified" | "rejected") {
    const reason = decision === "rejected" ? window.prompt("Rejection reason") ?? "" : undefined;
    if (decision === "verified" && !window.confirm("Mark this donation verified? A screenshot or reference is not proof of settlement.")) return;
    try {
      await decideChurchDonation({ churchId, donationId, decision, reason });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the donation.");
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Verification and totals</h2>
        <Button type="button" variant="outline" onClick={() => void refresh()}>Refresh</Button>
      </div>
      {report ? (
        <p className="text-sm">
          Verified ₹{report.verifiedTotal} · Pending ₹{report.pendingTotal} · Rejected ₹{report.rejectedTotal}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Load totals to review pending church donations.</p>
      )}
      <div className="grid gap-2 md:grid-cols-4">
        <Input placeholder="Campaign id" value={campaignId} onChange={(event) => setCampaignId(event.target.value)} />
        <Input placeholder="Amount INR" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Donation date" />
        <Input placeholder="Donor name" value={donorName} onChange={(event) => setDonorName(event.target.value)} />
      </div>
      <Button type="button" disabled={savingOffline} onClick={() => void offline()}>
        {savingOffline ? "Recording…" : "Record offline donation"}
      </Button>
      <ul className="space-y-2">
        {report?.rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <span>
              ₹{row.amount} · {row.receivingMethod ?? row.recordSource} · {row.verificationStatus ?? row.paymentStatus}
            </span>
            {row.verificationStatus === "awaiting_verification" ? (
              <span className="flex gap-2">
                <Button type="button" size="sm" onClick={() => void decide(row.id, "verified")}>Verify</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void decide(row.id, "rejected")}>Reject</Button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
