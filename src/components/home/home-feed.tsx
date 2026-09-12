import { auth } from "@clerk/nextjs/server";

import type { FirebaseChurch } from "@/types/firebase-church";

import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import { getWorshipCatalogCached } from "@/lib/cached-worship-data";
import { filterPublishedEvents } from "@/lib/event-firestore";
import type { ContentQueryInput } from "@/lib/content/content-scope";

import { HomeArticlesSection } from "./home-articles-section";
import { HomeDonationsSection } from "./home-donations-section";
import { HomeEventsSection } from "./home-events-section";
import { HomePrayerCommunitySection } from "./home-prayer-community-section";
import { HomeSermonsSection } from "./home-sermons-section";
import { HomeShortsSection } from "./home-shorts-section";
import { HomeSongsSection } from "./home-songs-section";

type HomeFeedProps = {
  contentQuery: ContentQueryInput;
  church: FirebaseChurch | null;
  showMission?: boolean;
};

export async function HomeFeed({
  contentQuery,
  church,
  showMission = false,
}: HomeFeedProps) {
  const showEvents = church?.settings?.showEvents !== false;
  const session = await auth();

  const [catalog, shorts, campaigns] = await Promise.all([
    getWorshipCatalogCached(contentQuery),
    getPublishedShortsForViewer(contentQuery, "church", {
      clerkId: session.userId ?? null,
      email: session.sessionClaims?.email as string | undefined,
      limit: 5,
    }),
    showMission ? getActiveDonationCampaignsCached(contentQuery, 3) : [],
  ]);

  const upcomingEvents = showEvents
    ? filterPublishedEvents(catalog.events)
    : [];

  return (
    <div className="space-y-8">
      {showEvents ? <HomeEventsSection events={upcomingEvents} /> : null}
      <HomeSongsSection songs={catalog.songs} />
      <HomeShortsSection shorts={shorts} />
      <HomeSermonsSection sermons={catalog.sermons} />
      <HomeArticlesSection articles={catalog.articles} />
      {showMission ? <HomePrayerCommunitySection /> : null}
      {showMission ? <HomeDonationsSection campaigns={campaigns} /> : null}
    </div>
  );
}
