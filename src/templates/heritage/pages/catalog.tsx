import { getTranslations } from "next-intl/server";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { BookRecord } from "@/types/book";
import type { FirebaseSong } from "@/types/firebase-song";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageContentFrame } from "@/templates/heritage/components/heritage-content-frame";
import { HeritageMemberGate } from "@/templates/heritage/components/heritage-member-gate";
import { BooksCatalog } from "@/components/books/books-catalog";
import { SongsTabContent } from "@/components/worship/songs-tab-content";

export async function HeritageSongsPage({
  model,
  songs,
}: {
  model: ChurchWebsiteViewModel;
  songs: FirebaseSong[];
}) {
  const t = await getTranslations("heritage.pages");
  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("worship")}
      title={t("songs")}
      description={t("songsDescription", { name: model.church.name })}
    >
      <SongsTabContent
        initialSongs={songs}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/songs")}
        showCollectionHeader={false}
      />
    </HeritageContentFrame>
  );
}

export async function HeritageBooksPage({
  model,
  books,
}: {
  model: ChurchWebsiteViewModel;
  books: BookRecord[];
}) {
  const t = await getTranslations("heritage.pages");
  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("library")}
      title={t("books")}
      description={t("booksDescription", { name: model.church.name })}
    >
      <BooksCatalog
        books={books}
        hrefPrefix={churchWebsitePath(model.church.slug, "/books")}
      />
    </HeritageContentFrame>
  );
}

export async function HeritageCommunityPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const t = await getTranslations("heritage.pages");
  const tNav = await getTranslations("heritage.nav");
  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow={t("community")}
      title={t("community")}
      description={t("communityDescription", { name: model.church.name })}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <HeritageButton href={churchWebsitePath(model.church.slug, "/ministries")} arrow>
          {tNav("ministries")}
        </HeritageButton>
        <HeritageButton
          href={churchWebsitePath(model.church.slug, "/prayer")}
          variant="outline"
        >
          {tNav("prayer")}
        </HeritageButton>
      </div>
    </HeritageContentFrame>
  );
}

export function HeritageShepherdPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  return <HeritageMemberGate model={model} featureLabel="Shepherd AI" />;
}
