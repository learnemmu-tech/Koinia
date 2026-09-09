import { NextResponse } from "next/server";

import { resolveBookAdminScope, scopeAllowsBook } from "@/lib/books/admin-scope";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getBookById, updateBookCover } from "@/lib/postgres/books";
import {
  deleteStoredMediaUrls,
  uploadPublicObject,
} from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/upload-limits";

type RouteContext = { params: Promise<{ id: string }> };

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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Cover image is required." }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadPublicObject({
    kind: "book",
    entityId: book.id,
    ext,
    body: buffer,
    contentType: file.type || "image/jpeg",
  });

  await deleteStoredMediaUrls(book.coverImageUrl);
  await updateBookCover(book.id, uploaded.publicUrl);
  return NextResponse.json({ url: uploaded.publicUrl });
}
