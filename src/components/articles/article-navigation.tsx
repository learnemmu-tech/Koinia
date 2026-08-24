import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { FirebaseArticle } from "@/types/firebase-article";

import { Button } from "@/components/ui/button";

type ArticleNavigationProps = {
  previous: FirebaseArticle | null;
  next: FirebaseArticle | null;
};

export function ArticleNavigation({ previous, next }: ArticleNavigationProps) {
  if (!previous && !next) return null;

  return (
    <section className="mt-12 border-t border-border/30 pt-8 sm:mt-14">
      <div className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Button
            asChild
            variant="ghost"
            className="h-auto justify-start rounded-lg px-3 py-3 text-left hover:bg-muted/40"
          >
            <Link href={`/articles/${encodeURIComponent(previous.id)}`}>
              <span className="flex w-full flex-col gap-1.5">
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <ChevronLeft className="size-3.5" />
                  Previous
                </span>
                <span className="line-clamp-2 font-sans text-sm font-medium leading-snug text-foreground sm:text-base">
                  {previous.title}
                </span>
              </span>
            </Link>
          </Button>
        ) : (
          <div />
        )}

        {next ? (
          <Button
            asChild
            variant="ghost"
            className="h-auto justify-end rounded-lg px-3 py-3 text-right hover:bg-muted/40 sm:col-start-2"
          >
            <Link href={`/articles/${encodeURIComponent(next.id)}`}>
              <span className="flex w-full flex-col items-end gap-1.5">
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Next
                  <ChevronRight className="size-3.5" />
                </span>
                <span className="line-clamp-2 font-sans text-sm font-medium leading-snug text-foreground sm:text-base">
                  {next.title}
                </span>
              </span>
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
