import type { Metadata } from "next";

import { ArticlesTabContent } from "@/components/worship/articles-tab-content";
import { ArticlesAdminBar } from "@/components/admin/inline/articles-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedArticlesCached } from "@/lib/cached-worship-data";
import { pageContentClass } from "@/lib/responsive-classes";
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
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const articles = await getPublishedArticlesCached(contentQuery);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="articles-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <I18nPageHeading ns="articles" headingId="articles-heading" />
        <ArticlesAdminBar
          contentScope={isPlatformPublic ? "platform_public" : "organization"}
        />
      </header>

      <ArticlesTabContent
        initialArticles={articles}
        isPlatformPublic={isPlatformPublic}
      />
    </section>
  );
}
