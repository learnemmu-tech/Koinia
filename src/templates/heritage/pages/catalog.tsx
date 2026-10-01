import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { BookRecord } from "@/types/book";
import type { FirebaseSong } from "@/types/firebase-song";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import {
  HeritageContentFrame,
  HeritagePageIntro,
} from "@/templates/heritage/components/heritage-content-frame";
import { HeritageMemberGate } from "@/templates/heritage/components/heritage-member-gate";
import { BooksCatalog } from "@/components/books/books-catalog";
import { SongsTabContent } from "@/components/worship/songs-tab-content";

export function HeritageSongsPage({
  model,
  songs,
}: {
  model: ChurchWebsiteViewModel;
  songs: FirebaseSong[];
}) {
  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow="Worship"
      title="Songs"
      description={`Worship songs from ${model.church.name}.`}
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

export function HeritageBooksPage({
  model,
  books,
}: {
  model: ChurchWebsiteViewModel;
  books: BookRecord[];
}) {
  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow="Library"
      title="Books"
      description={`Books shared by ${model.church.name}.`}
    >
      <BooksCatalog
        books={books}
        hrefPrefix={churchWebsitePath(model.church.slug, "/books")}
      />
    </HeritageContentFrame>
  );
}

export function HeritageCommunityPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <HeritagePageIntro
        churchName={model.church.name}
        eyebrow="Community"
        title="Community"
        description={`Walk with ${model.church.name} through ministries, prayer, and shared life.`}
      />
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <HeritageButton href={churchWebsitePath(model.church.slug, "/ministries")} arrow>
          Ministries
        </HeritageButton>
        <HeritageButton
          href={churchWebsitePath(model.church.slug, "/prayer")}
          variant="outline"
        >
          Prayer
        </HeritageButton>
      </div>
    </section>
  );
}

export function HeritageShepherdPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  return <HeritageMemberGate model={model} featureLabel="Shepherd AI" />;
}
