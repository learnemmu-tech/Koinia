import { DonationSuccessClient } from "@/components/donations/donation-success-client";

type DonationSuccessPageProps = {
  searchParams: Promise<{ donationId?: string }>;
};

export default async function DonationSuccessPage({
  searchParams,
}: DonationSuccessPageProps) {
  const { donationId = "" } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl pb-10 pt-8">
      <DonationSuccessClient donationId={donationId} />
    </div>
  );
}
