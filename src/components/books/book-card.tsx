"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, MoreHorizontal, Smartphone, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  bookDigitalPriceDisplay,
  bookPhysicalPriceDisplay,
  editionBadgeLabel,
  type BookPriceDisplay,
} from "@/lib/books/display";
import { cn } from "@/lib/utils";
import type { BookRecord } from "@/types/book";

function PriceBox({
  item,
  icon,
}: {
  item: BookPriceDisplay;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
      <span className="text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] text-muted-foreground">{item.label}</p>
        <p
          className={cn(
            "truncate text-xs font-semibold",
            item.isFree ? "text-emerald-700" : "text-foreground"
          )}
        >
          {item.value}
        </p>
      </div>
    </div>
  );
}

export function BookCard({
  book,
  href,
  showStatus = false,
  onEdit,
  onArchive,
  onDelete,
}: {
  book: BookRecord;
  href: string;
  showStatus?: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("books");
  const canManage = Boolean(onEdit || onArchive || onDelete);
  const digital = bookDigitalPriceDisplay(book);
  const physical = bookPhysicalPriceDisplay(book);
  const statusLabel =
    book.status === "draft"
      ? tc("draft")
      : book.status === "published"
        ? tc("published")
        : book.status === "archived"
          ? tc("archived")
          : book.status;

  return (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      )}
    >
      <div className="relative px-3 pt-3">
        <Link
          href={href}
          className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ImageWithFallback
            src={book.coverImageUrl || DEFAULT_SONG_COVER}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 280px"
            alt={book.title}
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </Link>

        {canManage ?
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Book actions"
                className={cn(
                  "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-md border border-border/70 bg-card/95 text-foreground shadow-sm",
                  "opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                  "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <MoreHorizontal className="size-3.5" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={href}>{tc("view")}</Link>
              </DropdownMenuItem>
              {onEdit ?
                <DropdownMenuItem onSelect={onEdit}>{tc("edit")}</DropdownMenuItem>
              : null}
              {onArchive || onDelete ? <DropdownMenuSeparator /> : null}
              {onArchive && book.status !== "archived" ?
                <DropdownMenuItem onSelect={onArchive}>{tc("archive")}</DropdownMenuItem>
              : null}
              {onDelete ?
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={onDelete}
                >
                  {tc("delete")}
                </DropdownMenuItem>
              : null}
            </DropdownMenuContent>
          </DropdownMenu>
        : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-2.5">
        <div className="space-y-1.5">
          <span className="inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-sky-50 px-2 text-[11px] font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
            <Sparkles className="size-3 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{editionBadgeLabel(book)}</span>
          </span>

          <Link href={href} className="block outline-none focus-visible:underline">
            <h3 className="line-clamp-2 font-heading text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground">
              {book.title}
            </h3>
          </Link>
          <p className="truncate text-[13px] text-muted-foreground">{book.authorName}</p>
          {showStatus ?
            <p className="text-[11px] capitalize text-muted-foreground">{statusLabel}</p>
          : null}
        </div>

        {(digital || physical) ?
          <div className="mt-auto flex gap-2">
            {digital ?
              <PriceBox
                item={digital}
                icon={<Smartphone className="size-3.5" aria-hidden />}
              />
            : null}
            {physical ?
              <PriceBox
                item={physical}
                icon={<BookOpen className="size-3.5" aria-hidden />}
              />
            : null}
          </div>
        : <div className="mt-auto" />}

        <Link
          href={href}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg",
            "bg-primary text-sm font-medium text-primary-foreground",
            "transition-colors hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          {t("viewBook")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export function BookCardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
