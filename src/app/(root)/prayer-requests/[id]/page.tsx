import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentAuthRequired } from "@/components/auth/content-auth-required";
import { PrayerRequestDetailClient } from "@/components/prayer/prayer-request-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { isAuthenticatedServer } from "@/lib/auth-server";
import { getPrayerRequestById } from "@/lib/firebase-prayer-request-queries";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

type PrayerRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PrayerRequestDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const request = await getPrayerRequestById(id);

  if (!request || request.status !== "approved") {
    return { title: "Prayer Request Not Found" };
  }

  return buildPageMetadata({
    title: request.title,
    description: `Join the FaithConnectHub community in prayer for: ${request.title}`,
    path: `/prayer-requests/${encodeURIComponent(id)}`,
    keywords: ["prayer request", "Christian prayer", "intercession", request.title],
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

  const request = await getPrayerRequestById(id);

  if (!request || request.status !== "approved") {
    notFound();
  }

  const path = `/prayer-requests/${encodeURIComponent(id)}`;

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
