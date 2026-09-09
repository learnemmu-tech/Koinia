"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Layers, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { BookPageHeader } from "@/components/books/book-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  saveBook,
  uploadBookCover,
  uploadBookPdf,
} from "@/lib/books/books-client";
import {
  BOOK_LANGUAGES,
  ISO_CURRENCIES,
  centsToMajorInput,
  parseMajorAmountToCents,
} from "@/lib/books/currency";
import { upsertBookSchema } from "@/lib/books/validation";
import { validateImageFile } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import type { BookRecord, BookStatus, BookType, BookVisibility } from "@/types/book";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "text-[13px] font-medium text-foreground";
const sectionClass = "space-y-3 rounded-[10px] border border-border bg-card p-4";

const TYPE_IDS = [
  { id: "digital" as const, icon: FileText },
  { id: "physical" as const, icon: Package },
  { id: "both" as const, icon: Layers },
];

function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SegmentedButtons<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex h-9 overflow-hidden rounded-md border border-input">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-2 text-xs font-medium capitalize focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value ?
              "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BookForm({
  book,
  churches,
}: {
  book?: BookRecord;
  churches: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const t = useTranslations("books");
  const tc = useTranslations("common");
  const tf = useTranslations("forms");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | false>(false);
  const [title, setTitle] = useState(book?.title ?? "");
  const [authorName, setAuthorName] = useState(book?.authorName ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [language, setLanguage] = useState(book?.language ?? "en");
  const [currency, setCurrency] = useState(book?.currency ?? "USD");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "draft");
  const [visibility, setVisibility] = useState<BookVisibility>(
    book?.visibility ?? "public"
  );
  const [bookType, setBookType] = useState<BookType>(book?.bookType ?? "digital");
  const [churchId, setChurchId] = useState(book?.churchId ?? churches[0]?.id ?? "");
  const [digitalAccess, setDigitalAccess] = useState(
    book?.digital?.accessMode ?? "free"
  );
  const [digitalPrice, setDigitalPrice] = useState(
    centsToMajorInput(book?.digital?.priceCents ?? 0)
  );
  const [physicalAccess, setPhysicalAccess] = useState<"free" | "paid">(
    (book?.physical?.priceCents ?? 0) > 0 ? "paid" : "free"
  );
  const [physicalPrice, setPhysicalPrice] = useState(
    centsToMajorInput(book?.physical?.priceCents ?? 0)
  );
  const [stock, setStock] = useState(String(book?.physical?.stockQuantity ?? 0));
  const [sku, setSku] = useState(book?.physical?.sku ?? "");
  const [weight, setWeight] = useState(
    book?.physical?.weightGrams != null ? String(book.physical.weightGrams) : ""
  );
  const [shippingAvailable, setShippingAvailable] = useState(
    book?.physical?.shippingAvailable ?? true
  );
  const [physicalActive, setPhysicalActive] = useState(
    book?.physical?.isActive ?? true
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    book?.coverImageUrl ?? null
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfRemoved, setPdfRemoved] = useState(false);

  const showDigital = bookType === "digital" || bookType === "both";
  const showPhysical = bookType === "physical" || bookType === "both";
  const pdfLabel = pdfFile?.name || (!pdfRemoved ? book?.digital?.fileName : null);
  const pdfSize =
    pdfFile ? formatBytes(pdfFile.size)
    : !pdfRemoved ? formatBytes(book?.digital?.fileSize)
    : null;

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function onCoverChange(file: File | null) {
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setCoverFile(file);
    if (!file) setCoverPreview(book?.coverImageUrl ?? null);
  }

  async function persist(nextStatus: BookStatus) {
    if (!user) {
      toast.error(t("signInRequired"));
      return;
    }
    const digitalCents =
      digitalAccess === "paid" ?
        parseMajorAmountToCents(digitalPrice)
      : 0;
    const physicalCents =
      physicalAccess === "paid" ?
        parseMajorAmountToCents(physicalPrice)
      : 0;
    if (digitalCents == null || physicalCents == null) {
      toast.error(t("invalidPrice"));
      return;
    }

    const payload = upsertBookSchema.safeParse({
      churchId,
      title,
      authorName,
      description,
      language,
      currency,
      status: nextStatus,
      visibility,
      bookType,
      digital: showDigital ?
        { accessMode: digitalAccess, priceCents: digitalCents, currency }
      : null,
      physical: showPhysical ?
        {
          priceCents: physicalCents,
          currency,
          stockQuantity: Number(stock) || 0,
          sku: sku.trim() || null,
          weightGrams: weight.trim() ? Number(weight) : null,
          shippingAvailable,
          isActive: physicalActive,
        }
      : null,
    });

    if (!payload.success) {
      toast.error(payload.error.issues[0]?.message ?? t("checkForm"));
      return;
    }

    setSaving(nextStatus === "draft" ? "draft" : "publish");
    try {
      const token = await user.getIdToken();
      const { book: saved } = await saveBook(token, payload.data, book?.id);
      if (coverFile) await uploadBookCover(token, saved.id, coverFile);
      if (pdfFile && showDigital) await uploadBookPdf(token, saved.id, pdfFile);
      toast.success(
        nextStatus === "draft" ?
          t("draftSaved")
        : book ? t("updated")
        : t("created")
      );
      router.replace("/dashboard/books");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void persist(status === "archived" ? "archived" : status);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-5xl space-y-5">
      <BookPageHeader
        backHref="/dashboard/books"
        title={book ? t("editTitle") : t("createTitle")}
        description={t("formDescription")}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <section className={sectionClass}>
            <h2 className="text-sm font-semibold">Cover</h2>
            <input
              ref={coverInputRef}
              id="cover"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => onCoverChange(event.target.files?.[0] ?? null)}
            />
            <div className="flex items-start gap-3">
              <button
                type="button"
                aria-label={coverPreview ? t("replaceCover") : t("uploadCover")}
                onClick={() => coverInputRef.current?.click()}
                className="relative aspect-[2/3] w-[108px] shrink-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 transition-colors hover:border-foreground/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {coverPreview ?
                  coverPreview.startsWith("blob:") ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  : <ImageWithFallback
                      src={coverPreview}
                      fallback={coverPreview}
                      fill
                      alt=""
                      className="object-cover"
                      sizes="108px"
                    />
                : <span className="flex h-full flex-col items-center justify-center gap-1 px-2 text-[10px] text-muted-foreground">
                    <Plus className="size-4" aria-hidden />
                    Upload cover
                    <span>JPG / PNG</span>
                  </span>
                }
              </button>
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Portrait cover, approximately 2:3 ratio.
                </p>
                {coverPreview ?
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {tc("replace")}
                    </Button>
                    {coverFile ?
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                          onCoverChange(null);
                          if (coverInputRef.current) coverInputRef.current.value = "";
                        }}
                      >
                        {tc("remove")}
                      </Button>
                    : null}
                  </div>
                : null}
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold">Book information</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title" className={labelClass}>
                  {tf("title")}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="author" className={labelClass}>
                  Author
                </Label>
                <Input
                  id="author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language" className={labelClass}>
                  {t("languageLabel")}
                </Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={fieldClass}
                >
                  {BOOK_LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="book-currency" className={labelClass}>
                  Currency
                </Label>
                <select
                  id="book-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={fieldClass}
                >
                  {ISO_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description" className={labelClass}>
                  {tf("description")}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[96px] resize-none text-sm"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className={sectionClass}>
            <h2 className="text-sm font-semibold">Publishing</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="church" className={labelClass}>
                  {t("church")}
                </Label>
                <select
                  id="church"
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  {churches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>{t("status")}</p>
                <SegmentedButtons
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "draft", label: t("draft") },
                    { value: "published", label: t("published") },
                    { value: "archived", label: t("archived") },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>{tf("visibility")}</p>
                <SegmentedButtons
                  value={visibility}
                  onChange={setVisibility}
                  options={[
                    { value: "public", label: t("public") },
                    { value: "members_only", label: t("membersOnly") },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold">{t("edition")}</h2>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_IDS.map((item) => {
                const Icon = item.icon;
                const selected = bookType === item.id;
                const label =
                  item.id === "both" ? t("bothLabel")
                  : item.id === "digital" ? t("digital")
                  : t("physical");
                const description =
                  item.id === "both" ? t("bothDesc")
                  : item.id === "digital" ? t("digitalDesc")
                  : t("physicalDesc");
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setBookType(item.id)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ?
                        "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-foreground/20"
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {showDigital ?
              <div className="mt-3 space-y-3 rounded-lg border border-border/70 p-3">
                <h3 className="text-sm font-semibold">{t("digitalEdition")}</h3>
                <div className="space-y-1.5">
                  <p className={labelClass}>{t("access")}</p>
                  <SegmentedButtons
                    value={digitalAccess}
                    onChange={setDigitalAccess}
                    options={[
                      { value: "free", label: t("free") },
                      { value: "paid", label: t("paid") },
                    ]}
                  />
                </div>
                {digitalAccess === "paid" ?
                  <div className="space-y-1.5">
                    <Label htmlFor="digital-price" className={labelClass}>
                      Price ({currency})
                    </Label>
                    <Input
                      id="digital-price"
                      inputMode="decimal"
                      value={digitalPrice}
                      onChange={(e) => setDigitalPrice(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                : null}
                <div className="space-y-1.5">
                  <p className={labelClass}>PDF file</p>
                  <input
                    ref={pdfInputRef}
                    id="pdf"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      setPdfFile(e.target.files?.[0] ?? null);
                      setPdfRemoved(false);
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border px-3 py-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{pdfLabel || t("uploadPdf")}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {pdfSize || t("pdfOnly")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      {pdfLabel ? tc("replace") : tc("upload")}
                    </Button>
                    {pdfFile ?
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                          setPdfFile(null);
                          setPdfRemoved(true);
                          if (pdfInputRef.current) pdfInputRef.current.value = "";
                        }}
                      >
                        {tc("remove")}
                      </Button>
                    : null}
                  </div>
                </div>
              </div>
            : null}

            {showPhysical ?
              <div className="mt-3 space-y-3 rounded-lg border border-border/70 p-3">
                <h3 className="text-sm font-semibold">{t("physicalEdition")}</h3>
                <div className="space-y-1.5">
                  <p className={labelClass}>{t("access")}</p>
                  <SegmentedButtons
                    value={physicalAccess}
                    onChange={(value) => {
                      setPhysicalAccess(value);
                      if (value === "free") setPhysicalPrice("0");
                    }}
                    options={[
                      { value: "free", label: t("free") },
                      { value: "paid", label: t("paid") },
                    ]}
                  />
                </div>
                {physicalAccess === "paid" ?
                  <div className="space-y-1.5">
                    <Label htmlFor="physical-price" className={labelClass}>
                      Price ({currency})
                    </Label>
                    <Input
                      id="physical-price"
                      inputMode="decimal"
                      value={physicalPrice}
                      onChange={(e) => setPhysicalPrice(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="stock" className={labelClass}>
                      Availability
                    </Label>
                    <Input
                      id="stock"
                      inputMode="numeric"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sku" className={labelClass}>
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className={labelClass}>
                      Weight (grams)
                    </Label>
                    <Input
                      id="weight"
                      inputMode="numeric"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shippingAvailable}
                        onChange={(e) => setShippingAvailable(e.target.checked)}
                      />
                      Shipping available
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={physicalActive}
                        onChange={(e) => setPhysicalActive(e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                </div>
              </div>
            : null}
          </section>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-9 sm:w-auto"
          onClick={() => router.push("/dashboard/books")}
        >
          {tc("cancel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 sm:w-auto"
          disabled={Boolean(saving) || !churchId}
          onClick={() => void persist("draft")}
        >
          {saving === "draft" ? tc("saving") : t("saveDraft")}
        </Button>
        <Button
          type="submit"
          className="h-9 sm:w-auto"
          disabled={Boolean(saving) || !churchId}
        >
          {saving === "publish" ?
            tc("saving")
          : book ?
            t("saveChanges")
          : t("create")}
        </Button>
      </div>
    </form>
  );
}
