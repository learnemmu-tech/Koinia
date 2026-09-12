"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Church,
  FileText,
  Globe2,
  Home,
  Layers,
  ShoppingCart,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { ShareContentButton } from "@/components/share-content-button";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { canOrderPhysicalBook, canReadDigitalBook } from "@/lib/books/access";
import {
  bookDigitalPriceDisplay,
  bookPhysicalPriceDisplay,
  languageLabel,
} from "@/lib/books/display";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { cn } from "@/lib/utils";
import type { BookRecord } from "@/types/book";

type EditionKey = "digital" | "physical";

const DESCRIPTION_PREVIEW_CHARS = 420;

function formatPublishedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
  const canUseDigitalFile = canManage || digitalAccess.allowed;
  const paidDigitalLocked = !canManage && digitalAccess.reason === "paid";

  const hasDigital = Boolean(book.digital);
  const hasPhysical = Boolean(book.physical);

  const [selectedEdition, setSelectedEdition] = useState<EditionKey>(() => {
    if (book.bookType === "physical" && hasPhysical) return "physical";
    if (hasDigital) return "digital";
    return "physical";
  });
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const formatBadge =
    book.bookType === "digital" ? t("digital")
    : book.bookType === "physical" ? t("physical")
    : t("bothLabel");
  const statusLabel =
    book.status === "published" ? t("published")
    : book.status === "draft" ? t("draft")
    : t("archived");

  const digitalPrice = bookDigitalPriceDisplay(book);
  const physicalPrice = bookPhysicalPriceDisplay(book);
  const publishedDate = formatPublishedDate(book.createdAt);

  const description = book.description?.trim() ?? "";
  const descriptionNeedsToggle = description.length > DESCRIPTION_PREVIEW_CHARS;
  const visibleDescription =
    !descriptionNeedsToggle || descriptionExpanded ?
      description
    : `${description.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}…`;

  const infoRows = useMemo(() => {
    const rows: Array<{
      key: string;
      label: string;
      value: string;
      icon: ReactNode;
    }> = [
      {
        key: "author",
        label: t("author"),
        value: book.authorName,
        icon: <UserRound className="size-4" aria-hidden />,
      },
      {
        key: "church",
        label: t("church"),
        value: book.churchName,
        icon: <Church className="size-4" aria-hidden />,
      },
    ];
    if (book.organizationName?.trim()) {
      rows.push({
        key: "organization",
        label: t("organization"),
        value: book.organizationName,
        icon: <Building2 className="size-4" aria-hidden />,
      });
    }
    rows.push(
      {
        key: "language",
        label: t("languageLabel"),
        value: languageLabel(book.language),
        icon: <Globe2 className="size-4" aria-hidden />,
      },
      {
        key: "status",
        label: t("status"),
        value: statusLabel,
        icon: <FileText className="size-4" aria-hidden />,
      },
      {
        key: "format",
        label: t("format"),
        value: formatBadge,
        icon: <Layers className="size-4" aria-hidden />,
      }
    );
    if (publishedDate) {
      rows.push({
        key: "published",
        label: t("publishedDate"),
        value: publishedDate,
        icon: <CalendarDays className="size-4" aria-hidden />,
      });
    }
    if (book.digital?.pageCount && book.digital.pageCount > 0) {
      rows.push({
        key: "pages",
        label: t("pages"),
        value: String(book.digital.pageCount),
        icon: <BookOpen className="size-4" aria-hidden />,
      });
    }
    return rows;
  }, [book, formatBadge, publishedDate, statusLabel, t]);

  const digitalFeatures = useMemo(() => {
    if (!book.digital) return [];
    const features: string[] = [];
    if (book.digital.hasFile) {
      features.push(t("featureInstantAccess"));
      features.push(t("featureReadDownload"));
      features.push(t("featurePdfAvailable"));
      features.push(t("featureKeepDigital"));
    } else {
      features.push(t("pdfMissing"));
    }
    if (book.digital.accessMode === "free") {
      features.push(t("featureFreeDigital"));
    }
    return features;
  }, [book.digital, t]);

  const physicalFeatures = useMemo(() => {
    if (!book.physical) return [];
    const features: string[] = [];
    features.push(t("featurePrintEdition"));
    if (book.physical.shippingAvailable) {
      features.push(t("featureShippingAvailable"));
    } else {
      features.push(t("shippingUnavailable"));
    }
    if (book.physical.stockQuantity > 0) {
      features.push(
        t("featureStockAvailable", { count: book.physical.stockQuantity })
      );
    } else {
      features.push(t("unavailable"));
    }
    if (book.physical.priceCents <= 0) {
      features.push(t("featureFreePhysical"));
    }
    return features;
  }, [book.physical, t]);

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

  const digitalPrimary =
    selectedEdition === "digital" &&
    hasDigital &&
    (canUseDigitalFile || paidDigitalLocked);
  const physicalPrimary = selectedEdition === "physical" && hasPhysical;
  const showDigitalSecondary =
    !digitalPrimary && hasDigital && (canUseDigitalFile || paidDigitalLocked);
  const showPhysicalSecondary = !physicalPrimary && hasPhysical;

  return (
    <article className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-8 pt-1">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="size-3.5" aria-hidden />
          <span className="sr-only">{t("breadcrumbHome")}</span>
        </Link>
        <span aria-hidden className="text-muted-foreground/60">
          /
        </span>
        <Link
          href="/books"
          className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("title")}
        </Link>
        <span aria-hidden className="text-muted-foreground/60">
          /
        </span>
        <span className="line-clamp-1 max-w-[min(100%,28rem)] text-foreground/80">
          {book.title}
        </span>
      </nav>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[220px] sm:max-w-[240px] lg:mx-0 lg:max-w-none">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm">
            <ImageWithFallback
              src={book.coverImageUrl || DEFAULT_SONG_COVER}
              fallback={DEFAULT_SONG_COVER}
              fill
              alt={book.title}
              className="object-cover"
              sizes="(max-width: 1024px) 240px, 260px"
              priority
            />
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2.5">
            <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary">
              {formatBadge}
            </span>

            <h1 className="font-heading text-[1.875rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2.125rem] lg:text-[2.5rem]">
              {book.title}
            </h1>

            <div className="flex w-fit max-w-full flex-wrap items-center justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-foreground/85">
                <UserRound
                  className="size-[1.125rem] shrink-0 text-primary/80"
                  aria-hidden
                />
                {book.authorName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Church
                  className="size-[1.125rem] shrink-0 text-primary/80"
                  aria-hidden
                />
                {book.churchName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText
                  className="size-[1.125rem] shrink-0 text-primary/80"
                  aria-hidden
                />
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2
                  className="size-[1.125rem] shrink-0 text-primary/80"
                  aria-hidden
                />
                {languageLabel(book.language)}
              </span>
            </div>
          </div>

          {(hasDigital || hasPhysical) && (hasDigital && hasPhysical) ?
            <div
              role="radiogroup"
              aria-label={t("edition")}
              className="grid w-full max-w-[44rem] gap-3 sm:grid-cols-[repeat(2,minmax(0,20.5rem))]"
            >
              {hasDigital && digitalPrice ?
                <EditionSelectCard
                  selected={selectedEdition === "digital"}
                  onSelect={() => setSelectedEdition("digital")}
                  icon={<Smartphone className="size-4" aria-hidden />}
                  title={t("digitalEdition")}
                  price={digitalPrice.value}
                  priceFree={digitalPrice.isFree}
                  hint={
                    book.digital?.hasFile ? t("pdfAvailable") : t("pdfMissing")
                  }
                />
              : null}
              {hasPhysical && physicalPrice ?
                <EditionSelectCard
                  selected={selectedEdition === "physical"}
                  onSelect={() => setSelectedEdition("physical")}
                  icon={<BookOpen className="size-4" aria-hidden />}
                  title={t("physicalEdition")}
                  price={physicalPrice.value}
                  priceFree={physicalPrice.isFree}
                  hint={
                    book.physical?.shippingAvailable ?
                      t("featureShippingAvailable")
                    : t("shippingUnavailable")
                  }
                />
              : null}
            </div>
          : (hasDigital && digitalPrice) || (hasPhysical && physicalPrice) ?
            <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {hasDigital ? t("digitalEdition") : t("physicalEdition")}
              </p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold",
                  (hasDigital ? digitalPrice?.isFree : physicalPrice?.isFree) ?
                    "text-emerald-700"
                  : "text-foreground"
                )}
              >
                {hasDigital ? digitalPrice?.value : physicalPrice?.value}
              </p>
            </div>
          : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {digitalPrimary ?
              paidDigitalLocked ?
                <Button
                  className="h-12 w-full rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-[10.5rem]"
                  disabled
                >
                  {t("buyDigital")}
                </Button>
              : <Button
                  className="h-12 w-full rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-[10.5rem]"
                  onClick={() => void openDigital("read")}
                >
                  {t("readBook")}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
            : null}

            {physicalPrimary ?
              canOrder ?
                <Button
                  className="h-12 w-full rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-[10.5rem]"
                  asChild
                >
                  <Link href={`/books/${book.id}/order`}>
                    <ShoppingCart className="size-4" aria-hidden />
                    {t("buyPhysical")}
                  </Link>
                </Button>
              : <Button
                  className="h-12 w-full rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-[10.5rem]"
                  disabled
                >
                  <ShoppingCart className="size-4" aria-hidden />
                  {t("buyPhysical")}
                </Button>
            : null}

            {digitalPrimary && !paidDigitalLocked ?
              <Button
                variant="outline"
                className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
                onClick={() => void openDigital("download")}
              >
                {t("download")}
              </Button>
            : null}

            {showPhysicalSecondary ?
              canOrder ?
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
                  asChild
                >
                  <Link href={`/books/${book.id}/order`}>
                    <ShoppingCart className="size-4" aria-hidden />
                    {t("buyPhysical")}
                  </Link>
                </Button>
              : <Button
                  variant="outline"
                  className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
                  disabled
                >
                  <ShoppingCart className="size-4" aria-hidden />
                  {t("buyPhysical")}
                </Button>
            : null}

            {showDigitalSecondary ?
              paidDigitalLocked ?
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
                  disabled
                >
                  {t("buyDigital")}
                </Button>
              : <Button
                  variant="outline"
                  className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
                  onClick={() => void openDigital("read")}
                >
                  {t("readBook")}
                </Button>
            : null}

            <ShareContentButton
              title={book.title}
              description={book.description || undefined}
              path={`/books/${book.id}`}
              className="h-12 w-full rounded-lg border-border/70 bg-card px-5 text-sm font-medium sm:w-auto"
            />
          </div>
        </div>
      </section>

      <div className="border-b border-border/60">
        <div role="tablist" aria-label={t("detailSections")} className="flex gap-6">
          {(
            [
              { id: "overview" as const, label: t("overview") },
              { id: "details" as const, label: t("details") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === tab.id ?
                  "text-primary"
                : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id ?
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              : null}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ?
        <div
          className={cn(
            "grid items-start gap-7",
            "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-5 lg:gap-y-7",
            hasDigital || hasPhysical ?
              "lg:[grid-template-areas:'about_info'_'edition_info']"
            : "lg:[grid-template-areas:'about_info']"
          )}
        >
          {description ?
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6 lg:[grid-area:about]">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="size-4 text-primary/90" aria-hidden />
                <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  {t("aboutThisBook")}
                </h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {visibleDescription}
              </p>
              {descriptionNeedsToggle ?
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((value) => !value)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {descriptionExpanded ? t("showLess") : t("showMore")}
                  {descriptionExpanded ?
                    <ChevronUp className="size-3.5" aria-hidden />
                  : <ChevronDown className="size-3.5" aria-hidden />
                  }
                </button>
              : null}
            </section>
          : <section className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-5 text-sm text-muted-foreground sm:p-6 lg:[grid-area:about]">
              {t("noDescription")}
            </section>
          }

          <div className="lg:[grid-area:info]">
            <BookInformationPanel
              rows={infoRows}
              title={t("bookInformation")}
            />
          </div>

          {hasDigital || hasPhysical ?
            <EditionInformationSection
              className="lg:[grid-area:edition]"
              digital={
                book.digital && digitalPrice ?
                  {
                    title: t("digitalEdition"),
                    price: digitalPrice.value,
                    priceFree: digitalPrice.isFree,
                    subtitle:
                      book.digital.hasFile ? t("pdfAvailable") : t("pdfMissing"),
                    features: digitalFeatures,
                    lockedMessage:
                      paidDigitalLocked ? t("purchaseComingSoon") : null,
                  }
                : null
              }
              physical={
                book.physical && physicalPrice ?
                  {
                    title: t("physicalEdition"),
                    price: physicalPrice.value,
                    priceFree: physicalPrice.isFree,
                    subtitle:
                      book.physical.shippingAvailable ?
                        t("featureShippingAvailable")
                      : t("shippingUnavailable"),
                    features: physicalFeatures,
                  }
                : null
              }
              heading={t("editionInformation")}
            />
          : null}
        </div>
      : <div className="space-y-7">
          <BookInformationPanel rows={infoRows} title={t("bookInformation")} />
          {hasDigital || hasPhysical ?
            <EditionInformationSection
              digital={
                book.digital && digitalPrice ?
                  {
                    title: t("digitalEdition"),
                    price: digitalPrice.value,
                    priceFree: digitalPrice.isFree,
                    subtitle:
                      book.digital.hasFile ? t("pdfAvailable") : t("pdfMissing"),
                    features: digitalFeatures,
                    lockedMessage:
                      paidDigitalLocked ? t("purchaseComingSoon") : null,
                  }
                : null
              }
              physical={
                book.physical && physicalPrice ?
                  {
                    title: t("physicalEdition"),
                    price: physicalPrice.value,
                    priceFree: physicalPrice.isFree,
                    subtitle:
                      book.physical.shippingAvailable ?
                        t("featureShippingAvailable")
                      : t("shippingUnavailable"),
                    features: physicalFeatures,
                  }
                : null
              }
              heading={t("editionInformation")}
            />
          : null}
        </div>
      }
    </article>
  );
}

type EditionCardData = {
  title: string;
  price: string;
  priceFree: boolean;
  subtitle: string;
  features: string[];
  lockedMessage?: string | null;
};

function EditionInformationSection({
  heading,
  digital,
  physical,
  className,
}: {
  heading: string;
  digital: EditionCardData | null;
  physical: EditionCardData | null;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3.5", className)}>
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-primary" aria-hidden />
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {heading}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {digital ?
          <EditionInfoCard
            icon={<Smartphone className="size-5" aria-hidden />}
            title={digital.title}
            price={digital.price}
            priceFree={digital.priceFree}
            subtitle={digital.subtitle}
            features={digital.features}
            lockedMessage={digital.lockedMessage}
          />
        : null}
        {physical ?
          <EditionInfoCard
            icon={<BookOpen className="size-5" aria-hidden />}
            title={physical.title}
            price={physical.price}
            priceFree={physical.priceFree}
            subtitle={physical.subtitle}
            features={physical.features}
          />
        : null}
      </div>
    </section>
  );
}

function BookInformationPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: string; value: string; icon: ReactNode }>;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="size-4 text-primary/90" aria-hidden />
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[1.25rem_minmax(0,7rem)_minmax(0,1fr)] items-center gap-x-2.5 text-sm"
          >
            <span className="text-primary/80" aria-hidden>
              {row.icon}
            </span>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EditionSelectCard({
  selected,
  onSelect,
  icon,
  title,
  price,
  priceFree,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  price: string;
  priceFree: boolean;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full max-w-[20.5rem] flex-col items-start gap-1.5 rounded-xl border px-3.5 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ?
          "border-primary bg-primary/[0.04] shadow-sm"
        : "border-border/70 bg-card hover:bg-muted/30"
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-foreground">
          <span
            className={cn(
              "shrink-0",
              selected ? "text-primary" : "text-muted-foreground"
            )}
          >
            {icon}
          </span>
          <span className="truncate text-sm font-semibold">{title}</span>
        </div>
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : (
              "border-border"
            )
          )}
          aria-hidden
        >
          {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
        </span>
      </div>
      <p
        className={cn(
          "text-[0.95rem] font-semibold leading-tight",
          priceFree ? "text-emerald-700" : "text-foreground"
        )}
      >
        {price}
      </p>
      <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
    </button>
  );
}

function EditionInfoCard({
  icon,
  title,
  price,
  priceFree,
  subtitle,
  features,
  lockedMessage,
}: {
  icon: ReactNode;
  title: string;
  price: string;
  priceFree: boolean;
  subtitle: string;
  features: string[];
  lockedMessage?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-primary/85">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p
            className={cn(
              "mt-1 text-lg font-semibold tracking-tight",
              priceFree ? "text-emerald-700" : "text-foreground"
            )}
          >
            {price}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          {features.length > 0 ?
            <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-foreground/90"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          : null}
          {lockedMessage ?
            <p className="mt-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {lockedMessage}
            </p>
          : null}
        </div>
      </div>
    </section>
  );
}
