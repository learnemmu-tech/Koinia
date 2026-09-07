import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getWorshipCatalogCached } from "@/lib/cached-worship-data";

import { WorshipCatalogProvider } from "@/context/worship-catalog-context";

import { WorshipTopItemsClient } from "./firebase-worship-top-items";

export async function FirebaseWorshipTopItems() {
  const { contentQuery } = await resolvePageContentQuery();
  const catalog = await getWorshipCatalogCached(contentQuery);

  return (
    <WorshipCatalogProvider catalog={catalog}>
      <WorshipTopItemsClient
        songs={catalog.songs.slice(0, 12)}
        sermons={catalog.sermons.slice(0, 12)}
        articles={catalog.articles.slice(0, 12)}
      />
    </WorshipCatalogProvider>
  );
}
