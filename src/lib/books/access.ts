import type { BookRecord } from "@/types/book";

export type BookViewer = {
  clerkId: string | null;
  isMemberOfTenant: boolean;
  hasDigitalEntitlement: boolean;
};

export function canViewBook(book: BookRecord, viewer: BookViewer): boolean {
  if (book.status !== "published") return false;
  if (book.visibility === "public") return true;
  return viewer.isMemberOfTenant;
}

export function canReadDigitalBook(
  book: BookRecord,
  viewer: BookViewer
): { allowed: boolean; reason: "ok" | "unpublished" | "members" | "paid" | "missing" } {
  if (book.status !== "published") return { allowed: false, reason: "unpublished" };
  if (book.bookType === "physical") return { allowed: false, reason: "missing" };
  const digital = book.digital;
  if (!digital?.hasFile) return { allowed: false, reason: "missing" };
  if (book.visibility === "members_only" && !viewer.isMemberOfTenant) {
    return { allowed: false, reason: "members" };
  }
  if (digital.accessMode === "paid") {
    if (viewer.hasDigitalEntitlement) return { allowed: true, reason: "ok" };
    return { allowed: false, reason: "paid" };
  }
  return { allowed: true, reason: "ok" };
}

export function canOrderPhysicalBook(book: BookRecord): boolean {
  if (book.status !== "published") return false;
  if (book.bookType === "digital") return false;
  const physical = book.physical;
  if (!physical) return false;
  return physical.isActive && physical.shippingAvailable && physical.stockQuantity > 0;
}
