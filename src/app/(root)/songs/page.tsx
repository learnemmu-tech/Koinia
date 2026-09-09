import type { Metadata } from "next";

import { SongsTabContent } from "@/components/worship/songs-tab-content";
import { SongsAdminBar } from "@/components/admin/inline/songs-admin-bar";
import { SongsPageHeading } from "@/components/worship/songs-page-heading";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedSongsCached } from "@/lib/cached-worship-data";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Worship Songs & Lyrics",
  description:
    "Browse Christian worship songs and lyrics on FaithConnectHub. Listen, sing, and grow in faith with Telugu and English worship music.",
  path: "/songs",
  keywords: [
    "worship songs",
    "Christian lyrics",
    "Telugu worship songs",
    "English worship songs",
    "worship music",
  ],
});

export default async function SongsPage() {
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const songs = await getPublishedSongsCached(contentQuery);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="songs-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SongsPageHeading />
        <SongsAdminBar
          contentScope={isPlatformPublic ? "platform_public" : "organization"}
        />
      </header>

      <SongsTabContent
        initialSongs={songs}
        isPlatformPublic={isPlatformPublic}
      />
    </section>
  );
}
