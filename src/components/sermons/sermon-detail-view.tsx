import { useTranslations } from "next-intl";

import {
  ContentDetailLayout,
  ContentListenWatchLink,
  formatDetailDate,
  type ContentDetailSidebarItem,
} from "@/components/content-detail-layout";
import { ContentActions } from "@/components/engagement/content-actions";
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
  const t = useTranslations("sermons");
  const tCommon = useTranslations("common");
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
    sidebarItems.push({ label: t("date"), value: dateLabel, icon: "calendar" });
  }
  if (scripture) {
    sidebarItems.push({ label: t("scripture"), value: scripture, icon: "book" });
  }
  if (speaker) {
    sidebarItems.push({ label: t("speaker"), value: speaker, icon: "user" });
  }

  const listenLabel =
    hasVideo && hasAudio ? t("listenWatch")
    : hasVideo ? t("watch")
    : t("listen");

  return (
    <ContentDetailLayout
      kind="sermon"
      kindLabel={t("kind")}
      backLabel={t("back")}
      backHref={hrefPrefix}
      coverUrl={coverUrl}
      coverAlt={sermon.title}
      title={sermon.title}
      author={speaker || undefined}
      metadata={metadata}
      excerpt={excerpt || sermon.subtitle?.trim() || undefined}
      content={sermon.content}
      contentHeading={sermon.content.trim() ? t("notes") : undefined}
      sidebarTitle={t("about")}
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
          label={tCommon("share")}
        />
      }
      heroActions={
        <>
          {hasMedia ? <ContentListenWatchLink label={listenLabel} /> : null}
          <ContentActions
            likeType="sermon"
            itemId={sermon.id}
            saveType="sermon"
            layout="detail"
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
