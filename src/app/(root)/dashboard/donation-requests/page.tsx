import { redirect } from "next/navigation";

/** Standalone admin route is retired. Review lives in Content Management → Donations. */
export default async function AdminDonationRequestsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; request?: string; error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams({ tab: "donations", section: "requests" });
  if (params.status) next.set("status", params.status);
  if (params.request) next.set("request", params.request);
  if (params.error) next.set("error", params.error);
  if (params.updated) next.set("updated", params.updated);
  redirect(`/dashboard/content?${next.toString()}`);
}
