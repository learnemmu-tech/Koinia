import type { Metadata } from "next";

import { ArticlesTabContent } from "@/components/worship/articles-tab-content";
import { ArticlesAdminBar } from "@/components/admin/inline/articles-admin-bar";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedArticlesCached } from "@/lib/cached-worship-data";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Christian Articles & Resources",
  description:
    "Read faith-building Christian articles and devotional resources on FaithConnectHub for daily encouragement and spiritual growth.",
  path: "/articles",
  keywords: ["Christian articles", "devotional reading", "faith resources", "biblical articles"],
});

export default async function ArticlesPage() {
  const { scope } = await getPageTenantContext();
  const articles = await getPublishedArticlesCached(scope);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="articles-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Reading
          </p>
          <h1 id="articles-heading" className={typePageTitleClass}>
            Articles
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Devotional articles and reflections for daily encouragement.
          </p>
        </div>
        <ArticlesAdminBar churchId={scope.churchId ?? ""} />
      </header>

      <ArticlesTabContent initialArticles={articles} />
    </section>
  );
}
