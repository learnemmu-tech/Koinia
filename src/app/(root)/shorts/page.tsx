import { redirect } from "next/navigation";

export default async function ShortsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ short?: string }>;
}) {
  const { short } = await searchParams;
  const params = new URLSearchParams({ tab: "shorts" });
  if (short?.trim()) {
    params.set("short", short.trim());
  }
  redirect(`/videos?${params.toString()}`);
}
