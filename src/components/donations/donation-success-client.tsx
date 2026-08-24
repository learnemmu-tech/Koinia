import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDonationAmount } from "@/lib/donation-firestore";
import { getDonationForSuccessPage } from "@/lib/donation-server";

type DonationSuccessClientProps = {
  donationId: string;
};

export async function DonationSuccessClient({
  donationId,
}: DonationSuccessClientProps) {
  const result = await getDonationForSuccessPage(donationId);

  if (!result || result.donation.paymentStatus !== "completed") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border/50 bg-card px-6 py-10 text-center shadow-sm">
        <h1 className="font-heading text-2xl font-bold">Payment Processing</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your payment is being confirmed. If you completed checkout, this page
          will update shortly.
        </p>
        <Button asChild className="mt-6">
          <Link href="/donations">Back to Donations</Link>
        </Button>
      </div>
    );
  }

  const { donation, campaign } = result;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border/50 bg-card px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-7 text-primary" />
      </div>
      <h1 className="mt-4 font-heading text-2xl font-bold">Thank You</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your generous gift helps our ministry continue serving the community.
      </p>

      <div className="mt-6 space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4 text-left text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Donation Amount</span>
          <span className="font-semibold">
            {formatDonationAmount(donation.amount, donation.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Campaign Supported</span>
          <span className="font-medium text-right">{campaign.title}</span>
        </div>
        {donation.transactionId ?
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Transaction Reference</span>
            <span className="max-w-[60%] break-all text-right font-mono text-xs">
              {donation.transactionId}
            </span>
          </div>
        : null}
      </div>

      <Button asChild className="mt-6 w-full sm:w-auto">
        <Link href="/donations">View More Campaigns</Link>
      </Button>
    </div>
  );
}
