import "server-only";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  bookDigitalEditions,
  bookDigitalEntitlements,
  bookPhysicalEditions,
  books,
  churches,
  organizations,
} from "@/db/schema";
import type { BookAdminScope } from "@/lib/books/admin-scope";
import type { UpsertBookInput } from "@/lib/books/validation";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import type {
  BookDigitalEdition,
  BookPhysicalEdition,
  BookRecord,
} from "@/types/book";

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "book";
}

async function uniqueSlug(
  organizationId: string,
  title: string,
  preferred?: string,
  excludeBookId?: string
): Promise<string> {
  const base = preferred?.trim() || slugify(title);
  let candidate = base;
  for (let i = 0; i < 20; i += 1) {
    const [existing] = await db
      .select({ id: books.id })
      .from(books)
      .where(
        and(
          eq(books.organizationId, organizationId),
          eq(books.slug, candidate)
        )
      )
      .limit(1);
    if (!existing || existing.id === excludeBookId) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapDigital(
  row: typeof bookDigitalEditions.$inferSelect | null | undefined
): BookDigitalEdition | null {
  if (!row) return null;
  return {
    id: row.id,
    bookId: row.bookId,
    fileName: row.fileName,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    pageCount: row.pageCount,
    hasFile: Boolean(row.fileObjectKey),
    accessMode: row.accessMode,
    priceCents: row.priceCents,
    currency: row.currency,
  };
}

function mapPhysical(
  row: typeof bookPhysicalEditions.$inferSelect | null | undefined
): BookPhysicalEdition | null {
  if (!row) return null;
  return {
    id: row.id,
    bookId: row.bookId,
    priceCents: row.priceCents,
    currency: row.currency,
    stockQuantity: row.stockQuantity,
    sku: row.sku,
    weightGrams: row.weightGrams,
    shippingAvailable: row.shippingAvailable,
    isActive: row.isActive,
  };
}

type JoinedBook = {
  book: typeof books.$inferSelect;
  digital: typeof bookDigitalEditions.$inferSelect | null;
  physical: typeof bookPhysicalEditions.$inferSelect | null;
  churchName: string | null;
  organizationName: string | null;
};

function mapBook(row: JoinedBook): BookRecord {
  return {
    id: row.book.id,
    organizationId: row.book.organizationId,
    churchId: row.book.churchId,
    title: row.book.title,
    slug: row.book.slug,
    authorName: row.book.authorName,
    description: row.book.description,
    coverImageUrl: row.book.coverImageUrl,
    status: row.book.status,
    visibility: row.book.visibility,
    bookType: row.book.bookType,
    language: row.book.language,
    currency: row.book.currency,
    createdBy: row.book.createdBy,
    createdAt: row.book.createdAt.toISOString(),
    updatedAt: row.book.updatedAt.toISOString(),
    churchName: row.churchName?.trim() || "Church",
    organizationName: row.organizationName?.trim() || "Organization",
    digital:
      row.book.bookType === "physical" ? null : mapDigital(row.digital),
    physical:
      row.book.bookType === "digital" ? null : mapPhysical(row.physical),
  };
}

const bookSelect = {
  book: books,
  digital: bookDigitalEditions,
  physical: bookPhysicalEditions,
  churchName: churches.name,
  organizationName: organizations.name,
};

function bookJoins() {
  return db
    .select(bookSelect)
    .from(books)
    .leftJoin(bookDigitalEditions, eq(bookDigitalEditions.bookId, books.id))
    .leftJoin(bookPhysicalEditions, eq(bookPhysicalEditions.bookId, books.id))
    .innerJoin(churches, eq(churches.id, books.churchId))
    .innerJoin(organizations, eq(organizations.id, books.organizationId));
}

export async function listPublishedCatalogBooks(options?: {
  query?: string;
  bookType?: "digital" | "physical" | "both";
  includeMembersOnlyForChurchIds?: string[];
}): Promise<BookRecord[]> {
  const filters = [eq(books.status, "published")];
  const memberChurchIds = options?.includeMembersOnlyForChurchIds?.filter(
    isPostgresUuid
  );

  if (memberChurchIds && memberChurchIds.length > 0) {
    filters.push(
      or(
        eq(books.visibility, "public"),
        and(
          eq(books.visibility, "members_only"),
          inArray(books.churchId, memberChurchIds)
        )
      )!
    );
  } else {
    filters.push(eq(books.visibility, "public"));
  }

  if (options?.bookType) {
    if (options.bookType === "both") {
      filters.push(eq(books.bookType, "both"));
    } else {
      filters.push(
        or(eq(books.bookType, options.bookType), eq(books.bookType, "both"))!
      );
    }
  }

  const q = options?.query?.trim();
  if (q) {
    const like = `%${q}%`;
    filters.push(
      or(
        ilike(books.title, like),
        ilike(books.authorName, like),
        ilike(books.description, like)
      )!
    );
  }

  const rows = await bookJoins()
    .where(and(...filters))
    .orderBy(desc(books.updatedAt))
    .limit(120);

  return rows.map(mapBook);
}

export async function listManagedBooks(
  scope: BookAdminScope,
  options?: { query?: string }
): Promise<BookRecord[]> {
  const filters = [eq(books.organizationId, scope.organizationId)];
  if (scope.kind === "church") {
    if (scope.churchIds.length === 0) return [];
    filters.push(inArray(books.churchId, scope.churchIds));
  }
  const q = options?.query?.trim();
  if (q) {
    const like = `%${q}%`;
    filters.push(
      or(ilike(books.title, like), ilike(books.authorName, like))!
    );
  }

  const rows = await bookJoins()
    .where(and(...filters))
    .orderBy(desc(books.updatedAt))
    .limit(200);

  return rows.map(mapBook);
}

export async function getBookById(bookId: string): Promise<BookRecord | null> {
  if (!isPostgresUuid(bookId)) return null;
  const [row] = await bookJoins().where(eq(books.id, bookId)).limit(1);
  return row ? mapBook(row) : null;
}

export async function getBookFileObjectKey(
  bookId: string
): Promise<string | null> {
  if (!isPostgresUuid(bookId)) return null;
  const [row] = await db
    .select({ fileObjectKey: bookDigitalEditions.fileObjectKey })
    .from(bookDigitalEditions)
    .where(eq(bookDigitalEditions.bookId, bookId))
    .limit(1);
  return row?.fileObjectKey ?? null;
}

export async function userHasDigitalEntitlement(
  userId: string,
  bookId: string
): Promise<boolean> {
  if (!isPostgresUuid(userId) || !isPostgresUuid(bookId)) return false;
  const [row] = await db
    .select({ id: bookDigitalEntitlements.id })
    .from(bookDigitalEntitlements)
    .where(
      and(
        eq(bookDigitalEntitlements.userId, userId),
        eq(bookDigitalEntitlements.bookId, bookId)
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function createBook(input: {
  organizationId: string;
  createdBy: string;
  data: UpsertBookInput;
}): Promise<BookRecord> {
  const slug = await uniqueSlug(
    input.organizationId,
    input.data.title,
    input.data.slug
  );

  const [created] = await db
    .insert(books)
    .values({
      organizationId: input.organizationId,
      churchId: input.data.churchId,
      title: input.data.title,
      slug,
      authorName: input.data.authorName,
      description: input.data.description,
      status: input.data.status,
      visibility: input.data.visibility,
      bookType: input.data.bookType,
      language: input.data.language,
      currency: input.data.currency,
      createdBy: input.createdBy,
    })
    .returning();

  if (!created) throw new Error("Could not create the book.");

  await syncEditions(created.id, input.data);
  const book = await getBookById(created.id);
  if (!book) throw new Error("Could not load the created book.");
  return book;
}

export async function updateBook(
  bookId: string,
  organizationId: string,
  data: UpsertBookInput
): Promise<BookRecord> {
  const slug = await uniqueSlug(
    organizationId,
    data.title,
    data.slug,
    bookId
  );

  await db
    .update(books)
    .set({
      churchId: data.churchId,
      title: data.title,
      slug,
      authorName: data.authorName,
      description: data.description,
      status: data.status,
      visibility: data.visibility,
      bookType: data.bookType,
      language: data.language,
      currency: data.currency,
    })
    .where(eq(books.id, bookId));

  await syncEditions(bookId, data);
  const book = await getBookById(bookId);
  if (!book) throw new Error("Could not load the updated book.");
  return book;
}

async function syncEditions(bookId: string, data: UpsertBookInput) {
  if (data.bookType === "digital" || data.bookType === "both") {
    if (!data.digital) return;
    const existing = await db
      .select({ id: bookDigitalEditions.id })
      .from(bookDigitalEditions)
      .where(eq(bookDigitalEditions.bookId, bookId))
      .limit(1);
    if (existing[0]) {
      await db
        .update(bookDigitalEditions)
        .set({
          accessMode: data.digital.accessMode,
          priceCents: data.digital.priceCents,
          currency: data.digital.currency,
        })
        .where(eq(bookDigitalEditions.bookId, bookId));
    } else {
      await db.insert(bookDigitalEditions).values({
        bookId,
        accessMode: data.digital.accessMode,
        priceCents: data.digital.priceCents,
        currency: data.digital.currency,
      });
    }
  } else {
    await db
      .delete(bookDigitalEditions)
      .where(eq(bookDigitalEditions.bookId, bookId));
  }

  if (data.bookType === "physical" || data.bookType === "both") {
    if (!data.physical) return;
    const existing = await db
      .select({ id: bookPhysicalEditions.id })
      .from(bookPhysicalEditions)
      .where(eq(bookPhysicalEditions.bookId, bookId))
      .limit(1);
    if (existing[0]) {
      await db
        .update(bookPhysicalEditions)
        .set({
          priceCents: data.physical.priceCents,
          currency: data.physical.currency,
          stockQuantity: data.physical.stockQuantity,
          sku: data.physical.sku?.trim() || null,
          weightGrams: data.physical.weightGrams ?? null,
          shippingAvailable: data.physical.shippingAvailable,
          isActive: data.physical.isActive,
        })
        .where(eq(bookPhysicalEditions.bookId, bookId));
    } else {
      await db.insert(bookPhysicalEditions).values({
        bookId,
        priceCents: data.physical.priceCents,
        currency: data.physical.currency,
        stockQuantity: data.physical.stockQuantity,
        sku: data.physical.sku?.trim() || null,
        weightGrams: data.physical.weightGrams ?? null,
        shippingAvailable: data.physical.shippingAvailable,
        isActive: data.physical.isActive,
      });
    }
  } else {
    await db
      .delete(bookPhysicalEditions)
      .where(eq(bookPhysicalEditions.bookId, bookId));
  }
}

export async function updateBookCover(
  bookId: string,
  coverImageUrl: string | null
): Promise<void> {
  await db.update(books).set({ coverImageUrl }).where(eq(books.id, bookId));
}

export async function updateDigitalFileMetadata(input: {
  bookId: string;
  fileObjectKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<void> {
  await db
    .update(bookDigitalEditions)
    .set({
      fileObjectKey: input.fileObjectKey,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    })
    .where(eq(bookDigitalEditions.bookId, input.bookId));
}

export async function deleteBook(bookId: string): Promise<void> {
  await db.delete(books).where(eq(books.id, bookId));
}

export async function decrementPhysicalStock(
  bookId: string,
  quantity: number
): Promise<boolean> {
  const result = await db
    .update(bookPhysicalEditions)
    .set({
      stockQuantity: sql`${bookPhysicalEditions.stockQuantity} - ${quantity}`,
    })
    .where(
      and(
        eq(bookPhysicalEditions.bookId, bookId),
        sql`${bookPhysicalEditions.stockQuantity} >= ${quantity}`
      )
    )
    .returning({ stockQuantity: bookPhysicalEditions.stockQuantity });
  return result.length > 0;
}
