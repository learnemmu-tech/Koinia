"use client";

import Link from "next/link";
import { DollarSign, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserDonations } from "@/hooks/use-user-donations";
import { formatDonationAmount } from "@/lib/donation-firestore";

const DONATION_DATE_LOCALE = "en-US";

function formatDonationDate(timestamp: number): string {
  return new Intl.DateTimeFormat(DONATION_DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function DashboardDonationsSection() {
  const { donations, loading } = useUserDonations();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Giving
          </p>
          <h2 className="font-heading text-xl font-bold">My Donations</h2>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
        >
          <Link href="/donations">Give Again</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="p-5 sm:p-6">
          {loading ?
            <div className="flex items-center justify-center py-14">
              <Loader2 className="size-5 animate-spin text-primary/60" />
            </div>
          : donations.length === 0 ?
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
              <DollarSign className="mx-auto size-7 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">No donations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your giving history will appear here after you donate.
              </p>
              <Button asChild className="mt-4 rounded-full" size="sm">
                <Link href="/donations">View Campaigns</Link>
              </Button>
            </div>
          : <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {formatDonationAmount(
                        donation.amount,
                        donation.currency
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDonationDate(donation.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      donation.paymentStatus === "completed" ?
                        "default"
                      : "secondary"
                    }
                    className="w-fit capitalize"
                  >
                    {donation.paymentStatus}
                  </Badge>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </section>
  );
}
