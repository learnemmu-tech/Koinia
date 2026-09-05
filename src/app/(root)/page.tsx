import type { Metadata } from "next";
import { Suspense } from "react";

import { HomeAdminFab } from "@/components/home-admin-fab";
import { HomeFeed } from "@/components/home/home-feed";
import { HomeFeedSkeleton } from "@/components/home/home-feed-skeleton";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { getPageTenantContext } from "@/lib/church-page-data";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

const title = "Christian Worship & Ministry Platform";
const description =
  "Discover worship songs, sermons, articles, prayer requests, and events on FaithConnectHub — a modern platform for Christian faith and community.";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: "/",
  useDynamicOg: true,
});

export default async function HomePage() {
  const { scope, church } = await getPageTenantContext();

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <HomeAdminFab />
      <HomeHeroSection church={church} />
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed scope={scope} church={church} />
      </Suspense>
    </div>
  );
}
