import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

import type { FirebaseChurch } from "@/types/firebase-church";

import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import {
  getPublishedArticlesCached,
  getPublishedEventsCached,
  getPublishedSermonsCached,
  getPublishedSongsCached,
} from "@/lib/cached-worship-data";
import { filterPublishedEvents } from "@/lib/event-firestore";
import { listLatestApprovedPrayerRequests } from "@/lib/prayer-request-queries.server";
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
  const showDonations = church?.settings?.showDonations !== false;
  const showPrayers = church?.settings?.showPrayerWall !== false;
  const anonymous =
    (await headers()).get("x-koinia-session") === "0";
  const session = anonymous ? null : await auth();

  const [songs, sermons, articles, events, shorts, campaigns, prayers] =
    await Promise.all([
      getPublishedSongsCached(contentQuery, 6),
      getPublishedSermonsCached(contentQuery, 6),
      getPublishedArticlesCached(contentQuery, 6),
      showEvents ? getPublishedEventsCached(contentQuery, 12) : [],
      getPublishedShortsForViewer(contentQuery, "church", {
        clerkId: session?.userId ?? null,
        email: session?.sessionClaims?.email as string | undefined,
        limit: 5,
      }),
      showMission && showDonations
        ? getActiveDonationCampaignsCached(contentQuery, 3)
        : [],
      showMission && showPrayers
        ? listLatestApprovedPrayerRequests(contentQuery, 3)
        : [],
    ]);

  const upcomingEvents = showEvents ? filterPublishedEvents(events) : [];

  return (
    <div className="space-y-8">
      {showEvents ? <HomeEventsSection events={upcomingEvents} /> : null}
      <HomeSongsSection songs={songs} />
      <HomeShortsSection shorts={shorts} />
      <HomeSermonsSection sermons={sermons} />
      <HomeArticlesSection articles={articles} />
      {showMission && showPrayers ? (
        <HomePrayerCommunitySection
          prayers={prayers.map((prayer) => ({
            id: prayer.id,
            text: prayer.request?.trim() || prayer.title,
          }))}
        />
      ) : null}
      {showMission && showDonations ? (
        <HomeDonationsSection campaigns={campaigns} />
      ) : null}
    </div>
  );
}
