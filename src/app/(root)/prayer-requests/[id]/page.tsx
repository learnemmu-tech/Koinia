import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentAuthRequired } from "@/components/auth/content-auth-required";
import { PrayerRequestDetailClient } from "@/components/prayer/prayer-request-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { isAuthenticatedServer } from "@/lib/auth-server";
import { loadReadablePrayerRequest } from "@/lib/prayer/prayer-authorization";
import { isPublicPrayerRequest } from "@/lib/prayer-request-firestore";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

// Per-viewer authorization: never cache this page across users.
export const dynamic = "force-dynamic";

type PrayerRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

// Metadata is generated before the auth gate and must not reveal request
// contents (titles) to anonymous or unauthorized callers.
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Prayer Request",
    description: "Join your church community in prayer.",
    path: "/prayer-requests",
    keywords: ["prayer request", "Christian prayer", "intercession"],
    noIndex: true,
  });
}

export default async function PrayerRequestDetailPage({
  params,
}: PrayerRequestDetailPageProps) {
  const { id } = await params;
  const callbackPath = `/prayer-requests/${encodeURIComponent(id)}`;
  const isAuthenticated = await isAuthenticatedServer();

  if (!isAuthenticated) {
    return <ContentAuthRequired callbackPath={callbackPath} />;
  }

  // Server-side gate: church membership / admin scope for the church that owns
  // the request. Unknown, other-church and private requests all yield 404.
  const request = await loadReadablePrayerRequest(id);
  if (!request) {
    notFound();
  }

  if (!isPublicPrayerRequest(request)) {
    notFound();
  }

  const path = callbackPath;

  return (
    <article aria-label={request.title}>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Prayer Requests", path: "/prayer-requests" },
          { name: request.title, path },
        ])}
      />
      <PrayerRequestDetailClient requestId={id} initialRequest={request} />
    </article>
  );
}
