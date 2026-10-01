import { redirect } from "next/navigation";

import { churchWebsitePath } from "@/lib/templates/paths";

export const dynamic = "force-dynamic";

/**
 * Fallback if a request reaches the page instead of the HTTP redirect.
 * Does not load church data or render the public shell.
 */
export default async function GroupsGatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(churchWebsitePath(slug, "/ministries"));
}
