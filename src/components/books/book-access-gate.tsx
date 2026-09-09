import Link from "next/link";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { BooksBackLink } from "@/components/books/book-page-header";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { pageDetailClass } from "@/lib/responsive-classes";
import type { BookRecord } from "@/types/book";

export function BookAccessGate({
  book,
  signedIn,
  callbackPath,
}: {
  book: BookRecord;
  signedIn: boolean;
  callbackPath: string;
}) {
  return (
    <article className={`${pageDetailClass} space-y-6 pt-2`}>
      <BooksBackLink />
      <div className="mx-auto max-w-lg space-y-5 text-center">
        <div className="relative mx-auto aspect-[2/3] w-36 overflow-hidden rounded-xl border border-border/50 bg-muted">
          <ImageWithFallback
            src={book.coverImageUrl || DEFAULT_SONG_COVER}
            fallback={DEFAULT_SONG_COVER}
            fill
            alt=""
            className="object-cover"
            sizes="144px"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Members only
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {book.title}
          </h1>
          <p className="text-sm text-muted-foreground">{book.authorName}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {signedIn ?
            "This book is available to members of this church or organization."
          : "Sign in with a church membership to view this book."}
        </p>
        {signedIn ? null : (
          <Button asChild size="sm" className="h-9">
            <Link href={`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`}>
              Sign in to continue
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
