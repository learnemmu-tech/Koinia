import type { Metadata } from "next";

import { ShortsPageClient } from "@/components/shorts/shorts-page-client";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import { buildPageMetadata } from "@/lib/seo";
import { auth } from "@clerk/nextjs/server";
import { userCanAccessChurchContent } from "@/lib/postgres/session";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Video Shorts",
  description:
    "Watch and share short-form Christian videos — worship, prayer, encouragement, and church moments on FaithConnectHub.",
  path: "/shorts",
  keywords: ["Christian shorts", "faith videos", "worship clips", "church moments"],
});

export default async function ShortsPage({
  searchParams,
}: {
  searchParams: Promise<{ short?: string }>;
}) {
  const { short: initialShortId } = await searchParams;
  const { scope, church } = await getPageTenantContext();
  const session = await auth();
  const shorts = await getPublishedShortsForViewer(scope, "church", {
    clerkId: session.userId ?? null,
    email: session.sessionClaims?.email as string | undefined,
  });
  let canPost = false;
  if (session.userId && scope.churchId) {
    canPost = await userCanAccessChurchContent(
      session.userId,
      session.sessionClaims?.email as string | undefined,
      scope.churchId
    );
  }

  return (
    <ShortsPageClient
      initialShorts={shorts}
      churchName={church?.name}
      canPost={canPost}
      initialShortId={initialShortId}
    />
  );
}
