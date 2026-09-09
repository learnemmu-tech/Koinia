import { NextResponse } from "next/server";

import { canReadDigitalBook } from "@/lib/books/access";
import {
  resolveBookAdminScope,
  scopeAllowsBook,
  userCanAccessBookAsMember,
} from "@/lib/books/admin-scope";
import { optionalBooksAuth } from "@/lib/books/optional-auth";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  getBookById,
  getBookFileObjectKey,
  updateDigitalFileMetadata,
  userHasDigitalEntitlement,
} from "@/lib/postgres/books";
import {
  createProtectedBookDownloadUrl,
  deleteProtectedBookObject,
  putProtectedBookObject,
} from "@/lib/storage/protected-book-storage";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const authUser = await optionalBooksAuth(request);
  const scope = authUser ? await resolveBookAdminScope(authUser.uid) : null;
  const isManager = Boolean(scope && scopeAllowsBook(scope, book));
  const isMember = await userCanAccessBookAsMember(authUser?.uid, book);
  const appUser = authUser ? await getAppUserByClerkId(authUser.uid) : null;
  const hasDigitalEntitlement = appUser
    ? await userHasDigitalEntitlement(appUser.id, book.id)
    : false;

  if (!isManager) {
    const access = canReadDigitalBook(book, {
      clerkId: authUser?.uid ?? null,
      isMemberOfTenant: isMember,
      hasDigitalEntitlement,
    });
    if (!access.allowed) {
      const status =
        access.reason === "members" || access.reason === "paid" ? 403 : 404;
      const message =
        access.reason === "paid" ?
          "Purchase is not available yet. Payment integration is coming soon."
        : access.reason === "members" ?
          "Sign in with a church membership to access this book."
        : "This digital edition is not available.";
      return NextResponse.json({ error: message, code: access.reason }, { status });
    }
  }

  const objectKey = await getBookFileObjectKey(book.id);
  if (!objectKey) {
    return NextResponse.json({ error: "No digital file is attached." }, { status: 404 });
  }

  const mode = new URL(request.url).searchParams.get("mode");
  const signedUrl = await createProtectedBookDownloadUrl(objectKey, 120, {
    downloadFileName:
      mode === "download" ? book.digital?.fileName || `${book.slug}.pdf` : null,
  });
  return NextResponse.redirect(signedUrl, 302);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const book = await getBookById(id);
  if (!book || !scopeAllowsBook(scope, book)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  if (book.bookType === "physical") {
    return NextResponse.json(
      { error: "This book does not have a digital edition." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Digital books must be PDF files." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF must be 50 MB or smaller." }, { status: 400 });
  }

  const previousKey = await getBookFileObjectKey(book.id);
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await putProtectedBookObject({
    organizationId: book.organizationId,
    bookId: book.id,
    ext: "pdf",
    body: buffer,
    contentType: "application/pdf",
  });

  await updateDigitalFileMetadata({
    bookId: book.id,
    fileObjectKey: uploaded.objectKey,
    fileName: file.name,
    fileSize: file.size,
    mimeType: "application/pdf",
  });
  await deleteProtectedBookObject(previousKey);

  return NextResponse.json({
    fileName: file.name,
    fileSize: file.size,
    mimeType: "application/pdf",
  });
}
