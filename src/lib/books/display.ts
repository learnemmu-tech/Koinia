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

export function bookAccessLines(book: BookRecord): string[] {
  const lines: string[] = [];
  if (book.digital) {
    lines.push(
      book.digital.accessMode === "paid" ?
        book.bookType === "both" ?
          `${formatCatalogPrice(book.digital.priceCents, book.digital.currency)} digital`
        : formatCatalogPrice(book.digital.priceCents, book.digital.currency)
      : book.bookType === "both" ? "Free digital"
      : "Free"
    );
  }
  if (book.physical) {
    lines.push(
      book.physical.priceCents > 0 ?
        book.bookType === "both" ?
          `${formatCatalogPrice(book.physical.priceCents, book.physical.currency)} physical`
        : formatCatalogPrice(book.physical.priceCents, book.physical.currency)
      : book.bookType === "both" ? "Free physical"
      : "Free"
    );
  }
  return lines;
}

export function languageLabel(code: string) {
  try {
    return new Intl.DisplayNames(undefined, { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
