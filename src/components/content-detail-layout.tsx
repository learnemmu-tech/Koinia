import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Play,
  Tag,
  UserRound,
} from "lucide-react";

import { BackButton } from "@/components/back-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { ReadingProse } from "@/components/reading-prose";
import { formatContentDate } from "@/lib/content-date";
import { cn } from "@/lib/utils";

export type ContentDetailKind = "sermon" | "article";

export type ContentDetailSidebarItem = {
  label: string;
  value: string;
  icon?: "calendar" | "user" | "tag" | "clock" | "book";
};

type ContentDetailLayoutProps = {
  kind: ContentDetailKind;
  kindLabel: string;
  backLabel: string;
  backHref: string;
  coverUrl: string;
  coverAlt: string;
  title: string;
  author?: string;
  authorImage?: string;
  /** Compact metadata segments joined with · */
  metadata: string[];
  excerpt?: string;
  content: string;
  contentHeading?: string;
  sidebarTitle: string;
  sidebarItems: ContentDetailSidebarItem[];
  scriptureReference?: string;
  tags?: string[];
  hasMedia?: boolean;
  showPlayAffordance?: boolean;
  headerAction?: ReactNode;
  heroActions?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
};

function SidebarIcon({
  name,
}: {
  name: NonNullable<ContentDetailSidebarItem["icon"]>;
}) {
  const className = "size-3.5 shrink-0 text-muted-foreground/80";
  switch (name) {
    case "calendar":
      return <CalendarDays className={className} aria-hidden />;
    case "user":
      return <UserRound className={className} aria-hidden />;
    case "tag":
      return <Tag className={className} aria-hidden />;
    case "clock":
      return <Clock3 className={className} aria-hidden />;
    case "book":
      return <BookOpen className={className} aria-hidden />;
  }
}

/**
 * Shared premium detail shell for Sermons and Articles.
 * Sermon = media-first; Article = reading-first (pass media only when real).
 */
export function ContentDetailLayout({
  kind,
  kindLabel,
  backLabel,
  backHref,
  coverUrl,
  coverAlt,
  title,
  author,
  metadata,
  excerpt,
  content,
  contentHeading,
  sidebarTitle,
  sidebarItems,
  scriptureReference,
  tags,
  hasMedia = false,
  showPlayAffordance = false,
  headerAction,
  heroActions,
  media,
  footer,
}: ContentDetailLayoutProps) {
  const authorName = author?.trim();
  const excerptText = excerpt?.trim();
  const scripture = scriptureReference?.trim();
  const realTags = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const hasContent = Boolean(content.trim());

  return (
    <article className="mx-auto w-full min-w-0 max-w-6xl space-y-8 pb-10 pt-2">
      <div className="flex items-center justify-between gap-4">
        <BackButton label={backLabel} fallbackHref={backHref} />
        {headerAction}
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
          <ImageWithFallback
            src={coverUrl}
            fallback={coverUrl}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={coverAlt}
            className="object-cover"
            priority
          />
          {showPlayAffordance && hasMedia ?
            <a
              href="#content-media"
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-black/15 transition-colors hover:bg-black/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Play media"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-card/95 text-primary shadow-md">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </a>
          : null}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-3.5 lg:gap-4 lg:py-1">
          <span className="inline-flex h-7 w-fit max-w-full shrink-0 items-center truncate rounded-full bg-[hsl(var(--primary-subtle))] px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            {kindLabel}
          </span>

          <h1 className="font-heading text-[1.875rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]">
            {title}
          </h1>

          {authorName ?
            <p className="inline-flex items-center gap-2 text-base text-foreground/85">
              <UserRound className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="font-medium">{authorName}</span>
            </p>
          : null}

          {metadata.length > 0 ?
            <p className="text-sm text-muted-foreground">
              {metadata.join(" · ")}
            </p>
          : null}

          {excerptText ?
            <p className="line-clamp-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {excerptText}
            </p>
          : null}

          {heroActions ?
            <div className="flex w-full flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              {heroActions}
            </div>
          : null}
        </div>
      </section>

      {media ?
        <div id="content-media" className="scroll-mt-24">
          {media}
        </div>
      : null}

      <section
        className={cn(
          "grid gap-6 lg:items-start",
          kind === "article" ?
            "lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]"
          : "lg:grid-cols-[minmax(0,1.35fr)_minmax(14rem,18rem)]"
        )}
      >
        <div className="min-w-0 space-y-6">
          {scripture ?
            <section className="rounded-2xl border border-border/60 bg-[hsl(var(--primary-subtle))]/50 px-5 py-4 sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Scripture
              </p>
              <p className="mt-1.5 font-heading text-lg font-medium italic leading-snug text-foreground">
                {scripture}
              </p>
            </section>
          : null}

          {hasContent ?
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-6 shadow-sm sm:px-8 sm:py-8">
              {contentHeading ?
                <h2 className="mb-5 font-heading text-lg font-semibold tracking-tight text-foreground">
                  {contentHeading}
                </h2>
              : null}
              <ReadingProse
                content={content}
                className={cn(
                  kind === "article" && "max-w-[min(100%,48rem)]"
                )}
              />
            </div>
          : null}

          {realTags.length > 0 ?
            <ul className="flex flex-wrap gap-2">
              {realTags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex h-7 w-fit items-center rounded-full border border-border/70 bg-card px-2.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {sidebarTitle}
            </h2>
            <dl className="mt-4 space-y-3.5">
              {sidebarItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="grid grid-cols-[1.15rem_minmax(0,5.5rem)_minmax(0,1fr)] items-start gap-x-2.5 text-sm"
                >
                  <span className="mt-0.5">
                    {item.icon ? <SidebarIcon name={item.icon} /> : null}
                  </span>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-foreground [overflow-wrap:anywhere]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </section>

      {footer}
    </article>
  );
}

export function contentDetailPrimaryButtonClass(className?: string) {
  return cn(
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground sm:w-auto sm:min-w-[10.5rem]",
    "transition-colors hover:bg-[hsl(var(--primary-hover))] active:bg-[hsl(var(--primary-active))]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );
}

export function contentDetailSecondaryButtonClass(className?: string) {
  return cn(
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-5 text-sm font-semibold text-foreground sm:w-auto sm:min-w-[8.5rem]",
    "transition-colors hover:bg-muted/40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );
}

export function estimateReadingMinutes(content: string): number | null {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words < 40) return null;
  return Math.max(1, Math.round(words / 200));
}

export function formatDetailDate(timestamp: number) {
  return formatContentDate(timestamp);
}

export function ContentListenWatchLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <a href="#content-media" className={contentDetailPrimaryButtonClass(className)}>
      <Play className="size-4 fill-current" aria-hidden />
      {label}
    </a>
  );
}
