import Link from "next/link";

import type { FirebaseArticle } from "@/types/firebase-article";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import {
  formatArticleDate,
  getReadingTimeMinutes,
} from "@/lib/article-utils";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { contentCardGridClassName } from "@/lib/responsive-classes";
import { getSongCoverUrl } from "@/lib/utils";

type RelatedArticlesProps = {
  articles: FirebaseArticle[];
};

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border/30 pt-10 sm:mt-16">
      <div className="mb-6">
        <h2 className="font-sans text-lg font-semibold text-foreground sm:text-xl">
          Related Articles
        </h2>
      </div>

      <div className={contentCardGridClassName}>
        {articles.map((article) => {
          const coverUrl = getSongCoverUrl(article.coverImage);
          const readingTime = getReadingTimeMinutes(article.content);

          return (
            <Link
              key={article.id}
              href={`/articles/${encodeURIComponent(article.id)}`}
              className="group flex flex-col gap-3"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                <ImageWithFallback
                  src={coverUrl}
                  fallback={DEFAULT_SONG_COVER}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  alt={article.title}
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                {article.category ? (
                  <Badge
                    variant="secondary"
                    className="rounded-md border-0 bg-muted/50 px-2 py-0 text-[10px] font-medium text-muted-foreground"
                  >
                    {article.category}
                  </Badge>
                ) : null}

                <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-foreground/80">
                  {article.title}
                </h3>

                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.shortDescription}
                </p>

                <p className="text-xs text-muted-foreground">
                  {article.author} · {formatArticleDate(article.dateCreated)} ·{" "}
                  {readingTime} min read
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
