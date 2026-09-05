import type { FirebaseChurch } from "@/types/firebase-church";

import { getLatestApprovedPrayerRequestsCached } from "@/lib/cached-prayer-data";
import { getWorshipCatalogCached } from "@/lib/cached-worship-data";
import { splitEventsBySchedule } from "@/lib/event-firestore";
import type { TenantScope } from "@/lib/organization/tenant-scope";

import { HomeArticlesSection } from "./home-articles-section";
import { HomeEventsSection } from "./home-events-section";
import { HomePrayerSection } from "./home-prayer-section";
import { HomeSermonsSection } from "./home-sermons-section";
import { HomeSongsSection } from "./home-songs-section";

type HomeFeedProps = {
  scope: TenantScope;
  church: FirebaseChurch | null;
};

export async function HomeFeed({ scope, church }: HomeFeedProps) {
  const showEvents = church?.settings?.showEvents !== false;
  const showPrayer = church?.settings?.showPrayerWall !== false;

  const [catalog, prayers] = await Promise.all([
    getWorshipCatalogCached(scope),
    showPrayer ?
      getLatestApprovedPrayerRequestsCached(scope, 4)
    : Promise.resolve([]),
  ]);

  const upcomingEvents = showEvents
    ? splitEventsBySchedule(catalog.events).upcoming
    : [];

  return (
    <>
      <HomeSongsSection songs={catalog.songs} />
      <HomeSermonsSection sermons={catalog.sermons} />
      <HomeArticlesSection articles={catalog.articles} />
      {showEvents ? <HomeEventsSection events={upcomingEvents} /> : null}
      {showPrayer ? <HomePrayerSection requests={prayers} /> : null}
    </>
  );
}
