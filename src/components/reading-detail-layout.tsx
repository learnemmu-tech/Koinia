import type { ReactNode } from "react";

import { AuthorAvatar } from "@/components/author-avatar";
import { BackButton } from "@/components/back-button";
import { ContentCreatedDate } from "@/components/content-created-date";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { ReadingProse } from "@/components/reading-prose";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { pageDetailClass, typePageTitleClass } from "@/lib/responsive-classes";

type ReadingDetailLayoutProps = {
  coverUrl: string;
  coverAlt: string;
  category?: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  dateCreated: number;
  content: string;
  author?: string;
  authorImage?: string;
  headerAction?: ReactNode;
  beforeContent?: ReactNode;
  footer?: ReactNode;
};

export function ReadingDetailLayout({
  coverUrl,
  coverAlt,
  category,
  title,
  subtitle,
  shortDescription,
  dateCreated,
  content,
  author,
  authorImage,
  headerAction,
  beforeContent,
  footer,
}: ReadingDetailLayoutProps) {
  const authorName = author?.trim();

  return (
    <article className={`${pageDetailClass} space-y-6`}>
      <div className="flex items-center justify-between gap-4 pt-1 sm:pt-0">
        <BackButton />
        {headerAction}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
          <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border/50 sm:mx-0">
            <ImageWithFallback
              src={coverUrl}
              fallback={DEFAULT_SONG_COVER}
              width={160}
              height={160}
              alt={coverAlt}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 text-left">
            <h1 className={typePageTitleClass}>
              {title}
            </h1>

            {subtitle ? (
              <p className="font-sans text-base font-normal leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}

            {shortDescription ? (
              <p className="font-sans text-sm leading-relaxed text-muted-foreground/90">
                {shortDescription}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {authorName ? (
                <div className="flex items-center gap-2">
                  <AuthorAvatar name={authorName} imageUrl={authorImage} />
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    {authorName}
                  </span>
                </div>
              ) : null}

              {authorName ? (
                <span
                  aria-hidden
                  className="hidden text-muted-foreground/40 sm:inline"
                >
                  ·
                </span>
              ) : null}

              <ContentCreatedDate timestamp={dateCreated} />

              {category ? (
                <Badge
                  variant="secondary"
                  className="rounded-md border-0 bg-muted/60 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground"
                >
                  {category}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {beforeContent ? (
        <div className="space-y-6">{beforeContent}</div>
      ) : null}

      <div className="rounded-2xl border border-border/40 bg-card/30 px-4 py-6 sm:px-8 sm:py-8">
        <ReadingProse content={content} />
      </div>

      {footer}
    </article>
  );
}
