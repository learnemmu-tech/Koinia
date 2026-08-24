import { redirect } from "next/navigation";

type LegacyAdminRedirectProps = {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Permanent backward compatibility — /dashboard → /dashboard */
export default async function LegacyAdminWorshipPanelRedirect({
  searchParams,
}: LegacyAdminRedirectProps) {
  const query = searchParams ? await searchParams : {};
  const tab = typeof query.tab === "string" ? query.tab : undefined;
  const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : "";
  redirect(`/dashboard${suffix}`);
}
