import type { Metadata } from "next";

import { HomeAdminFab } from "@/components/home-admin-fab";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeSongsSection } from "@/components/home/home-songs-section";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedSongsCached } from "@/lib/cached-worship-data";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

const title = "Christian Worship & Ministry Platform";
const description =
  "Discover worship songs, sermons, articles, prayer requests, events, and donation campaigns on FaithConnectHub — a modern platform for Christian faith and community.";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: "/",
  useDynamicOg: true,
});

export default async function HomePage() {
  const { scope, church } = await getPageTenantContext();
  const songs = await getPublishedSongsCached(scope);

  return (
    <div className="space-y-4 sm:space-y-8 md:space-y-10">
      <HomeAdminFab />
      <section aria-label="Welcome to FaithConnectHub">
        <HomeHeroSection church={church} />
      </section>
      <section aria-labelledby="featured-songs-heading">
        <h2 id="featured-songs-heading" className="sr-only">
          Featured Worship Songs
        </h2>
        <HomeSongsSection initialSongs={songs} />
      </section>
    </div>
  );
}
