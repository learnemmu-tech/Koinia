import type { Metadata } from "next";

import { SongsTabContent } from "@/components/worship/songs-tab-content";
import { SongsAdminBar } from "@/components/admin/inline/songs-admin-bar";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedSongsCached } from "@/lib/cached-worship-data";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
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
  const { scope } = await getPageTenantContext();
  const songs = await getPublishedSongsCached(scope);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="songs-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Worship Collection
          </p>
          <h1 id="songs-heading" className={typePageTitleClass}>
            Songs
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Listen to Christian worship music and read Telugu and English lyrics.
          </p>
        </div>
        <SongsAdminBar churchId={scope.churchId ?? ""} />
      </header>

      <SongsTabContent initialSongs={songs} />
    </section>
  );
}
