import { auth } from "@clerk/nextjs/server";

import type { FirebaseChurch } from "@/types/firebase-church";

import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import { getWorshipCatalogCached } from "@/lib/cached-worship-data";
import { splitEventsBySchedule } from "@/lib/event-firestore";
import type { TenantScope } from "@/lib/organization/tenant-scope";

import { HomeArticlesSection } from "./home-articles-section";
import { HomeEventsSection } from "./home-events-section";
import { HomeSermonsSection } from "./home-sermons-section";
import { HomeShortsSection } from "./home-shorts-section";
import { HomeSongsSection } from "./home-songs-section";

type HomeFeedProps = {
  scope: TenantScope;
  church: FirebaseChurch | null;
};

export async function HomeFeed({ scope, church }: HomeFeedProps) {
  const showEvents = church?.settings?.showEvents !== false;
  const session = await auth();

  const [catalog, shorts] = await Promise.all([
    getWorshipCatalogCached(scope),
    getPublishedShortsForViewer(scope, "church", {
      clerkId: session.userId ?? null,
      email: session.sessionClaims?.email as string | undefined,
      limit: 5,
    }),
  ]);

  const upcomingEvents = showEvents
    ? splitEventsBySchedule(catalog.events).upcoming
    : [];

  return (
    <div className="space-y-8">
      <HomeSongsSection songs={catalog.songs} />
      <HomeShortsSection shorts={shorts} />
      <HomeSermonsSection sermons={catalog.sermons} />
      <HomeArticlesSection articles={catalog.articles} />
      {showEvents ? <HomeEventsSection events={upcomingEvents} /> : null}
    </div>
  );
}
