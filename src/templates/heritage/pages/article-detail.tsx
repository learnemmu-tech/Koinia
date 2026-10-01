import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { FirebaseArticle } from "@/types/firebase-article";
import { ArticleDetailView } from "@/components/articles/article-detail-view";
import {
  getArticleNeighbors,
  getRelatedArticles,
} from "@/lib/article-utils";
import { tenantContentQuery } from "@/lib/content/content-scope";
import { listArticles } from "@/lib/postgres/features";
import { HeritageDetailFrame } from "@/templates/heritage/components/heritage-content-frame";

export async function HeritageArticleDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseArticle;
}) {
  const published = await listArticles(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );
  const { previous, next } = getArticleNeighbors(published, item.id);
  const relatedArticles = getRelatedArticles(published, item.id, 3);

  return (
    <HeritageDetailFrame>
      <ArticleDetailView
        article={item}
        relatedArticles={relatedArticles}
        previousArticle={previous}
        nextArticle={next}
        hrefPrefix={churchWebsitePath(model.church.slug, "/articles")}
      />
    </HeritageDetailFrame>
  );
}
