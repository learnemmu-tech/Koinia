"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CreditCard, MoreHorizontal, Unlock, Users } from "lucide-react";

import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { bookAccessLines, editionBadgeLabel } from "@/lib/books/display";
import { cn } from "@/lib/utils";
import type { BookRecord } from "@/types/book";
import { useTranslations } from "next-intl";

function AccessLineIcon({ book, line }: { book: BookRecord; line: string }) {
  const className = "size-3 shrink-0 text-[#6B7280]";
  if (book.visibility === "members_only") {
    return <Users className={className} aria-hidden />;
  }
  const lower = line.toLowerCase();
  if (lower.includes("free")) {
    return <Unlock className={className} aria-hidden />;
  }
  if (/^[A-Z]{3}\s[\d.]/.test(line)) {
    return <CreditCard className={className} aria-hidden />;
  }
  return <Unlock className={className} aria-hidden />;
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
  const canManage = Boolean(onEdit || onArchive || onDelete);
  const accessLines = bookAccessLines(book);
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
        "group relative flex w-full max-w-[210px] cursor-pointer flex-col overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#111111]",
        "transition-all duration-200 ease-in-out",
        "hover:-translate-y-[3px] hover:border-[#2A2A2A] hover:bg-[#141414] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      )}
    >
      <Link
        href={href}
        className="flex min-w-0 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#2A2A2A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
      >
        <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-[#1A1A1A]">
          <ImageWithFallback
            src={book.coverImageUrl || DEFAULT_SONG_COVER}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="(max-width: 640px) 44vw, 200px"
            alt=""
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.03]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)",
            }}
            aria-hidden
          />
        </div>
        <div className="flex flex-col bg-[#111111] px-2.5 pb-2.5 pt-2 text-left">
          <span className="mb-1.5 inline-flex w-fit rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium leading-none text-[#9CA3AF]">
            {editionBadgeLabel(book)}
          </span>
          <h3 className="mb-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-white">
            {book.title}
          </h3>
          <p className="mb-1 truncate text-[11px] text-[#6B7280]">
            {book.authorName}
          </p>
          {showStatus ?
            <p className="mb-1 text-[10px] capitalize text-[#6B7280]">
              {statusLabel}
            </p>
          : null}
          <div className="space-y-0.5 text-[10px] leading-snug text-[#4B5563]">
            {accessLines.map((line) => (
              <p key={line} className="flex min-w-0 items-center gap-1">
                <AccessLineIcon book={book} line={line} />
                <span className="truncate">{line}</span>
              </p>
            ))}
          </div>
        </div>
      </Link>

      {canManage ?
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Book actions"
              className={cn(
                "absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-md border border-white/10 bg-black/70 text-white",
                "opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A2A2A]"
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
        "grid w-full grid-cols-2 justify-items-start gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,210px))] sm:justify-start sm:gap-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex w-full max-w-[210px] flex-col overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#111111]">
      <div className="aspect-[2/3] w-full shrink-0 animate-pulse bg-[#1A1A1A]" />
      <div className="space-y-1.5 px-2.5 pb-2.5 pt-2">
        <div className="h-4 w-16 animate-pulse rounded bg-[#1A1A1A]" />
        <div className="h-8 w-full animate-pulse rounded bg-[#1A1A1A]" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-[#1A1A1A]" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-[#1A1A1A]" />
      </div>
    </div>
  );
}
