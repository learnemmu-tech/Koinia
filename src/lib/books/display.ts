import type { BookRecord } from "@/types/book";

export function editionBadgeLabel(book: { bookType: BookRecord["bookType"] }) {
  if (book.bookType === "digital") return "Digital";
  if (book.bookType === "physical") return "Physical";
  return "Digital + Physical";
}

export function formatCatalogPrice(cents: number, currency: string) {
  const amount = (Number.isFinite(cents) ? cents : 0) / 100;
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}

export type BookPriceDisplay = {
  label: "Digital" | "Physical";
  value: string;
  isFree: boolean;
};

export function bookDigitalPriceDisplay(book: BookRecord): BookPriceDisplay | null {
  if (!book.digital) return null;
  if (book.digital.accessMode === "paid") {
    return {
      label: "Digital",
      value: formatCatalogPrice(book.digital.priceCents, book.digital.currency),
      isFree: false,
    };
  }
  return { label: "Digital", value: "Free", isFree: true };
}

export function bookPhysicalPriceDisplay(book: BookRecord): BookPriceDisplay | null {
  if (!book.physical) return null;
  if (book.physical.priceCents > 0) {
    return {
      label: "Physical",
      value: formatCatalogPrice(book.physical.priceCents, book.physical.currency),
      isFree: false,
    };
  }
  return { label: "Physical", value: "Free", isFree: true };
}

export function bookAccessLines(book: BookRecord): string[] {
  const lines: string[] = [];
  const digital = bookDigitalPriceDisplay(book);
  if (digital) lines.push(`Digital · ${digital.value}`);
  const physical = bookPhysicalPriceDisplay(book);
  if (physical) lines.push(`Physical · ${physical.value}`);
  return lines;
}

export function languageLabel(code: string) {
  try {
    return new Intl.DisplayNames(undefined, { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
