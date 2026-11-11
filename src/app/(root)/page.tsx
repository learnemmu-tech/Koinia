import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { HomeAdminFab } from "@/components/home-admin-fab";
import { HomeFeed } from "@/components/home/home-feed";
import { HomeFeedSkeleton } from "@/components/home/home-feed-skeleton";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { getPageTenantContext } from "@/lib/church-page-data";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = "Christian Worship & Ministry Platform";
const description =
  "Discover worship songs, sermons, articles, events, and donations on FaithConnectHub — a modern platform for Christian faith and community.";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: "/",
  useDynamicOg: true,
});

export default async function HomePage() {
  const anonymous = (await headers()).get("x-koinia-session") === "0";
  const [{ church }, { contentQuery, isPlatformPublic }, session] =
    await Promise.all([
      getPageTenantContext(),
      resolvePageContentQuery(),
      anonymous ? Promise.resolve({ userId: null }) : auth(),
    ]);

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <HomeAdminFab />
      <HomeHeroSection church={church} isPlatformPublic={isPlatformPublic} />
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed
          contentQuery={contentQuery}
          church={church}
          showMission={!session.userId}
        />
      </Suspense>
    </div>
  );
}
