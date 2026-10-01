import {
  ContentDetailLayout,
  ContentListenWatchLink,
  formatDetailDate,
  type ContentDetailSidebarItem,
} from "@/components/content-detail-layout";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { SermonMediaSection } from "@/components/sermons/sermon-media-section";
import { ShareContentButton } from "@/components/share-content-button";
import { contentItemHref } from "@/lib/content/item-href";
import { getSongCoverUrl } from "@/lib/utils";
import type { FirebaseSermon } from "@/types/firebase-sermon";

export function SermonDetailView({
  sermon,
  hrefPrefix = "/sermons",
}: {
  sermon: FirebaseSermon;
  hrefPrefix?: string;
}) {
  const coverUrl = getSongCoverUrl(sermon.coverImage);
  const path = contentItemHref(hrefPrefix, sermon.id);
  const dateLabel = formatDetailDate(sermon.dateCreated);
  const speaker = sermon.speaker?.trim() || "";
  const scripture = sermon.scriptureReference?.trim() || "";
  const excerpt = sermon.shortDescription?.trim() || "";
  const hasVideo = Boolean(sermon.youtubeUrl?.trim());
  const hasAudio = Boolean(sermon.audioUrl?.trim());
  const hasMedia = hasVideo || hasAudio;

  const metadata = [dateLabel, scripture || null].filter(Boolean) as string[];

  const sidebarItems: ContentDetailSidebarItem[] = [];
  if (dateLabel) {
    sidebarItems.push({ label: "Date", value: dateLabel, icon: "calendar" });
  }
  if (scripture) {
    sidebarItems.push({ label: "Scripture", value: scripture, icon: "book" });
  }
  if (speaker) {
    sidebarItems.push({ label: "Speaker", value: speaker, icon: "user" });
  }

  const listenLabel =
    hasVideo && hasAudio ? "Listen / Watch"
    : hasVideo ? "Watch Sermon"
    : "Listen to Sermon";

  return (
    <ContentDetailLayout
      kind="sermon"
      kindLabel="Sermon"
      backLabel="Back to Sermons"
      backHref={hrefPrefix}
      coverUrl={coverUrl}
      coverAlt={sermon.title}
      title={sermon.title}
      author={speaker || undefined}
      metadata={metadata}
      excerpt={excerpt || sermon.subtitle?.trim() || undefined}
      content={sermon.content}
      contentHeading={sermon.content.trim() ? "Notes" : undefined}
      sidebarTitle="About this sermon"
      sidebarItems={sidebarItems}
      scriptureReference={scripture || undefined}
      tags={sermon.tags}
      hasMedia={hasMedia}
      showPlayAffordance={hasMedia}
      headerAction={
        <ShareContentButton
          title={sermon.title}
          description={excerpt || undefined}
          path={path}
          className="h-9 rounded-xl px-4"
          label="Share"
        />
      }
      heroActions={
        <>
          {hasMedia ? <ContentListenWatchLink label={listenLabel} /> : null}
          <FavoriteButton
            itemType="sermon"
            itemId={sermon.id}
            appearance="button"
          />
        </>
      }
      media={
        hasMedia ?
          <SermonMediaSection
            title={sermon.title}
            youtubeUrl={sermon.youtubeUrl}
            audioUrl={sermon.audioUrl}
          />
        : null
      }
    />
  );
}
