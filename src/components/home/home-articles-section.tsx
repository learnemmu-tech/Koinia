import type { FirebaseArticle } from "@/types/firebase-article";

import { FirebaseArticleCard } from "@/components/worship/firebase-article-card";

import { HomeCollectionRail, homeRailItemClass } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeArticlesSectionProps = {
  articles: FirebaseArticle[];
};

export function HomeArticlesSection({ articles }: HomeArticlesSectionProps) {
  const visible = [...articles]
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.dateCreated - a.dateCreated;
    })
    .slice(0, 3);

  return (
    <section aria-labelledby="home-articles-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-articles-heading"
        title="Latest Articles"
        description="Read faith, ministry, and community insights."
        href="/articles"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No articles yet"
          description="Check back soon for new writing from the community."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:max-w-4xl md:grid-cols-3 md:overflow-visible md:px-0">
          {visible.map((article) => (
            <div
              key={article.id}
              className={homeRailItemClass("w-[16rem] md:w-auto md:max-w-sm")}
            >
              <FirebaseArticleCard article={article} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
