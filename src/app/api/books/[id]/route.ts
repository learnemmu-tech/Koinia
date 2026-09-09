import { NextResponse } from "next/server";

import { canViewBook } from "@/lib/books/access";
import {
  assertChurchInOrganization,
  resolveBookAdminScope,
  scopeAllowsBook,
  scopeAllowsChurch,
  userCanAccessBookAsMember,
} from "@/lib/books/admin-scope";
import { upsertBookSchema } from "@/lib/books/validation";
import { optionalBooksAuth } from "@/lib/books/optional-auth";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { deleteProtectedBookObject } from "@/lib/storage/protected-book-storage";
import { deleteStoredMediaUrls } from "@/lib/supabase-storage";
import {
  deleteBook,
  getBookById,
  getBookFileObjectKey,
  updateBook,
  userHasDigitalEntitlement,
} from "@/lib/postgres/books";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { notifyIfBookNewlyPublished } from "@/lib/books/publish-notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const authUser = await optionalBooksAuth(request);
  const scope = authUser ? await resolveBookAdminScope(authUser.uid) : null;
  if (scope && scopeAllowsBook(scope, book)) {
    return NextResponse.json({ book, canManage: true });
  }

  const isMember = await userCanAccessBookAsMember(authUser?.uid, book);
  const appUser = authUser ? await getAppUserByClerkId(authUser.uid) : null;
  const hasDigitalEntitlement = appUser
    ? await userHasDigitalEntitlement(appUser.id, book.id)
    : false;

  if (
    !canViewBook(book, {
      clerkId: authUser?.uid ?? null,
      isMemberOfTenant: isMember,
      hasDigitalEntitlement,
    })
  ) {
    if (book.status === "published" && book.visibility === "members_only") {
      return NextResponse.json(
        { error: "Sign in to view this members-only book.", code: "members_only" },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ book, canManage: false, hasDigitalEntitlement });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const existing = await getBookById(id);
  if (!existing || !scopeAllowsBook(scope, existing)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = upsertBookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid book data." },
      { status: 400 }
    );
  }

  if (!scopeAllowsChurch(scope, parsed.data.churchId)) {
    return NextResponse.json(
      { error: "You cannot move this book to another church." },
      { status: 403 }
    );
  }

  const churchInOrg = await assertChurchInOrganization(
    parsed.data.churchId,
    scope.organizationId
  );
  if (!churchInOrg) {
    return NextResponse.json(
      { error: "That church is not part of this organization." },
      { status: 400 }
    );
  }

  if (parsed.data.bookType === "physical") {
    const fileKey = await getBookFileObjectKey(id);
    await deleteProtectedBookObject(fileKey);
  }

  const book = await updateBook(id, scope.organizationId, parsed.data);
  await notifyIfBookNewlyPublished({
    bookId: book.id,
    title: book.title,
    coverImageUrl: book.coverImageUrl,
    churchId: book.churchId,
    status: book.status,
    previousStatus: existing.status,
  });
  return NextResponse.json({ book });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const existing = await getBookById(id);
  if (!existing || !scopeAllowsBook(scope, existing)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const fileKey = await getBookFileObjectKey(id);
  await deleteBook(id);
  await Promise.all([
    deleteProtectedBookObject(fileKey),
    deleteStoredMediaUrls(existing.coverImageUrl),
  ]);
  return NextResponse.json({ success: true });
}
