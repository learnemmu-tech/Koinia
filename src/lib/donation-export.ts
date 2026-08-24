import type {
  FirebaseDonation,
  FirebaseDonationCampaign,
} from "@/types/firebase-donation";

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDonationDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildDonationsCsv(
  donations: FirebaseDonation[],
  campaigns: FirebaseDonationCampaign[]
): string {
  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign.title]));

  const headers = [
    "Donor Name",
    "Donor Email",
    "Amount",
    "Currency",
    "Campaign Name",
    "Date",
    "Status",
  ];

  const rows = donations.map((donation) => {
    const donorName =
      donation.isAnonymous ? "Anonymous" : donation.donorName.trim() || "—";

    return [
      escapeCsvValue(donorName),
      escapeCsvValue(donation.donorEmail.trim() || "—"),
      String(donation.amount),
      escapeCsvValue(donation.currency),
      escapeCsvValue(campaignById.get(donation.campaignId) ?? "Unknown campaign"),
      escapeCsvValue(formatDonationDate(donation.createdAt)),
      escapeCsvValue(donation.paymentStatus),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadDonationsCsv(
  donations: FirebaseDonation[],
  campaigns: FirebaseDonationCampaign[],
  churchId: string
): void {
  const csv = buildDonationsCsv(donations, campaigns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `donations-${churchId}-${dateStamp}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
