"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { BooksBackLink } from "@/components/books/book-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { createPhysicalOrder } from "@/lib/books/books-client";
import { ISO_COUNTRIES } from "@/lib/books/countries";
import { formatMoney } from "@/lib/books/currency";
import { editionBadgeLabel } from "@/lib/books/display";
import { createPhysicalOrderSchema } from "@/lib/books/validation";
import { pageDetailClass } from "@/lib/responsive-classes";
import type { BookOrderRecord, BookRecord } from "@/types/book";
import { useTranslations } from "next-intl";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PhysicalOrderForm({ book }: { book: BookRecord }) {
  const t = useTranslations("books");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const td = useTranslations("dashboard");
  const { user } = useFirebaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<BookOrderRecord | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [notes, setNotes] = useState("");

  const unitPrice = book.physical?.priceCents ?? 0;
  const currency = book.physical?.currency ?? book.currency;
  const maxQty = Math.min(99, book.physical?.stockQuantity ?? 1);
  const subtotal = unitPrice * quantity;
  const buyerEmail = user?.email ?? "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      toast.error(t("signInToOrder"));
      return;
    }

    const parsed = createPhysicalOrderSchema.safeParse({
      quantity,
      shippingName,
      shippingPhone,
      addressLine1,
      addressLine2: addressLine2.trim() || null,
      city,
      region,
      postalCode,
      country,
      notes: notes.trim() || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("checkForm"));
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const result = await createPhysicalOrder(token, book.id, parsed.data);
      setOrder(result.order);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orderCreateFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className={`${pageDetailClass} space-y-5 pt-2`}>
        <BooksBackLink href={`/books/${book.id}`} label={t("backToBook")} />
        <div className="rounded-[10px] border border-border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("orderReceived")}
          </p>
          <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight">
            {t("paymentPending")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("orderSavedPending")}
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("orderNumber")}</dt>
              <dd className="font-medium">{order.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("bookLabel")}</dt>
              <dd className="font-medium">{order.bookTitle}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("quantity")}</dt>
              <dd>{order.quantity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("total")}</dt>
              <dd className="font-medium">
                {formatMoney(order.totalCents, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("payment")}</dt>
              <dd className="capitalize">{order.paymentStatus}</dd>
            </div>
          </dl>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9">
          <Link href={`/books/${book.id}`}>{t("backToBook")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`${pageDetailClass} space-y-5 pt-2`}>
      <BooksBackLink href={`/books/${book.id}`} label={t("backToBook")} />

      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("physicalEdition")}
        </p>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {t("orderTitle", { title: book.title })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("orderPendingHint")}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className="space-y-3 rounded-[10px] border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("shippingInformation")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">{ta("email")}</Label>
              <Input
                id="email"
                type="email"
                value={buyerEmail}
                readOnly
                className="h-9 bg-muted/40 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="phone">{td("phoneLabel")}</Label>
              <Input
                id="phone"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="line1">{td("addressLabel")}</Label>
              <Input
                id="line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="line2">{t("apartmentOptional")}</Label>
              <Input
                id="line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("city")}</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">{t("stateProvince")}</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postal">{t("postalCode")}</Label>
              <Input
                id="postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">{t("country")}</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={fieldClass}
                required
              >
                {ISO_COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">{t("notesOptional")}</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[72px] resize-none text-sm"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-[10px] border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <ImageWithFallback
                  src={book.coverImageUrl || DEFAULT_SONG_COVER}
                  fallback={DEFAULT_SONG_COVER}
                  fill
                  alt=""
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {editionBadgeLabel(book)}
                </p>
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {book.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{book.authorName}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t("unitPrice")}</span>
                <span>
                  {unitPrice === 0 ? t("free") : formatMoney(unitPrice, currency)}
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">{t("quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.min(maxQty, Math.max(1, Number(event.target.value) || 1))
                    )
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-2 font-medium">
                <span>{t("total")}</span>
                <span>
                  {subtotal === 0 ? t("free") : formatMoney(subtotal, currency)}
                </span>
              </div>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            {t("checkoutNoProvider")}
          </p>

          <div className="flex flex-col gap-2">
            <Button type="submit" size="sm" className="h-9" disabled={submitting}>
              {submitting ? t("placingOrder") : t("placeOrderPending")}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" asChild>
              <Link href={`/books/${book.id}`}>{tc("cancel")}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}
