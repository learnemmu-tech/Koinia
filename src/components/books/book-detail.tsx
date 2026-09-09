"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { canOrderPhysicalBook, canReadDigitalBook } from "@/lib/books/access";
import {
  bookAccessLines,
  editionBadgeLabel,
  formatCatalogPrice,
  languageLabel,
} from "@/lib/books/display";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { pageDetailClass } from "@/lib/responsive-classes";
import { cn } from "@/lib/utils";
import type { BookRecord } from "@/types/book";
import { useTranslations } from "next-intl";

const btnPrimaryClass =
  "h-10 rounded-lg bg-white px-5 text-sm font-semibold text-black hover:bg-[#E5E5E5] disabled:cursor-not-allowed disabled:border disabled:border-[#1F1F1F] disabled:bg-[#1A1A1A] disabled:text-[#4B5563] disabled:opacity-100";

const btnSecondaryClass =
  "h-10 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-5 text-sm font-semibold text-white hover:bg-[#222222] disabled:cursor-not-allowed disabled:border-[#1F1F1F] disabled:bg-[#1A1A1A] disabled:text-[#4B5563] disabled:opacity-100";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs font-medium text-[#6B7280]">{label}</dt>
      <dd className="text-xs text-white">{value}</dd>
    </>
  );
}

function EditionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#1F1F1F] bg-[#111111] p-5",
        className
      )}
    >
      <h3 className="mb-3.5 text-[10px] font-bold uppercase tracking-[2px] text-[#6B7280]">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function BookDetail({
  book,
  hasDigitalEntitlement,
  isMemberOfTenant,
  canManage = false,
}: {
  book: BookRecord;
  hasDigitalEntitlement: boolean;
  isMemberOfTenant: boolean;
  canManage?: boolean;
}) {
  const { user } = useFirebaseAuth();
  const router = useRouter();
  const t = useTranslations("books");
  const digitalAccess = canReadDigitalBook(book, {
    clerkId: user?.uid ?? null,
    isMemberOfTenant,
    hasDigitalEntitlement,
  });
  const canOrder = canOrderPhysicalBook(book);
  const accessLines = bookAccessLines(book);
  const canUseDigitalFile = canManage || digitalAccess.allowed;
  const paidDigitalLocked = !canManage && digitalAccess.reason === "paid";
  const statusLabel =
    book.status === "published" ? t("published")
    : book.status === "draft" ? t("draft")
    : t("archived");

  async function openDigital(mode: "read" | "download") {
    if (!canUseDigitalFile) {
      if (digitalAccess.reason === "paid") {
        toast.message(t("purchaseComingSoon"));
        return;
      }
      if (digitalAccess.reason === "members") {
        router.push(`/signin?callbackUrl=/books/${book.id}`);
        return;
      }
      toast.error(t("digitalUnavailable"));
      return;
    }
    window.open(`/api/books/${book.id}/file?mode=${mode}`, "_blank", "noopener,noreferrer");
  }

  return (
    <article className={`${pageDetailClass} space-y-8 bg-[#0A0A0A] pt-2`}>
      <Link
        href="/books"
        className="mb-7 inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3.5 py-2 text-[13px] text-[#A1A1A1] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A2A2A]"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t("backToBooks")}
      </Link>

      <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:items-start md:gap-8">
        <div className="relative mx-auto aspect-[2/3] w-[120px] shrink-0 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:mx-0 md:w-[200px]">
          <ImageWithFallback
            src={book.coverImageUrl || DEFAULT_SONG_COVER}
            fallback={DEFAULT_SONG_COVER}
            fill
            alt=""
            className="object-cover"
            sizes="(max-width: 768px) 120px, 200px"
          />
        </div>

        <div className="min-w-0 space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[2px] text-[#6B7280]">
              {editionBadgeLabel(book)}
            </p>
            <h1 className="text-2xl font-extrabold leading-[1.1] tracking-[-0.5px] text-white md:text-[32px]">
              {book.title}
            </h1>
            <p className="mb-5 text-base font-normal text-[#A1A1A1]">
              {book.authorName}
            </p>
          </div>

          <hr className="my-4 border-[#1F1F1F]" />

          <dl className="mx-auto mb-6 grid w-fit grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left md:mx-0 md:w-full">
            <MetaRow label={t("church")} value={book.churchName} />
            <MetaRow label={t("languageLabel")} value={languageLabel(book.language)} />
            <MetaRow label={t("status")} value={statusLabel} />
            {accessLines.map((line) => (
              <MetaRow key={line} label={t("access")} value={line} />
            ))}
          </dl>

          <div className="flex flex-col gap-2 pt-1 md:flex-row md:flex-wrap">
            {book.digital && (canUseDigitalFile || paidDigitalLocked) ?
              paidDigitalLocked ?
                <Button size="sm" className={cn(btnPrimaryClass, "w-full md:w-auto")} disabled>
                  Buy digital
                </Button>
              : <>
                  <Button
                    size="sm"
                    className={cn(btnPrimaryClass, "w-full md:w-auto")}
                    onClick={() => void openDigital("read")}
                  >
                    Read
                  </Button>
                  <Button
                    size="sm"
                    className={cn(btnSecondaryClass, "w-full md:w-auto")}
                    onClick={() => void openDigital("download")}
                  >
                    Download
                  </Button>
                </>
            : null}
            {book.physical ?
              canOrder ?
                <Button
                  size="sm"
                  className={cn(btnSecondaryClass, "w-full md:w-auto")}
                  asChild
                >
                  <Link href={`/books/${book.id}/order`}>Order Physical</Link>
                </Button>
              : <Button
                  size="sm"
                  className={cn(btnSecondaryClass, "w-full md:w-auto")}
                  disabled
                >
                  Order Physical
                </Button>
            : null}
          </div>
        </div>
      </div>

      {book.description ?
        <section className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-6">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[2px] text-[#6B7280]">
            About this book
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-[1.8] text-[#A1A1A1]">
            {book.description}
          </p>
        </section>
      : null}

      <section className="space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#6B7280]">
          Edition information
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {book.digital ?
            <EditionCard title={t("digitalEdition")}>
              <p className="mb-1.5 text-xl font-bold text-white">
                {book.digital.accessMode === "paid" ?
                  formatCatalogPrice(book.digital.priceCents, book.digital.currency)
                : t("freeDigital")}
              </p>
              {book.digital.hasFile ?
                <p className="text-[13px] leading-relaxed text-[#6B7280]">PDF available</p>
              : <p className="text-[13px] leading-relaxed text-[#6B7280]">
                  {t("pdfMissing")}
                </p>
              }
              {paidDigitalLocked ?
                <p className="mt-2.5 rounded-md border border-[#1F1F1F] bg-white/[0.03] px-3 py-2 text-[11px] text-[#4B5563]">
                  {t("purchaseComingSoon")}
                </p>
              : null}
            </EditionCard>
          : null}

          {book.physical ?
            <EditionCard title={t("physicalEdition")}>
              <p className="mb-1.5 text-xl font-bold text-white">
                {book.physical.priceCents > 0 ?
                  formatCatalogPrice(book.physical.priceCents, book.physical.currency)
                : t("freePhysical")}
              </p>
              <p className="text-[13px] leading-relaxed text-[#6B7280]">
                {book.physical.stockQuantity > 0 ?
                  `${book.physical.stockQuantity} available`
                : t("unavailable")}
                {book.physical.shippingAvailable ? " · Shipping available" : ""}
              </p>
            </EditionCard>
          : null}
        </div>
      </section>
    </article>
  );
}
