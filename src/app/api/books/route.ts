import { NextResponse } from "next/server";

import { optionalBooksAuth } from "@/lib/books/optional-auth";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  assertChurchInOrganization,
  listCatalogMemberChurchIds,
  listChurchesForBookAdmin,
  resolveBookAdminScope,
  scopeAllowsChurch,
} from "@/lib/books/admin-scope";
import { upsertBookSchema } from "@/lib/books/validation";
import {
  createBook,
  listManagedBooks,
  listPublishedCatalogBooks,
} from "@/lib/postgres/books";
import { notifyIfBookNewlyPublished } from "@/lib/books/publish-notifications";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const manage = searchParams.get("manage") === "1";
  const query = searchParams.get("q")?.trim() || undefined;
  const bookType = searchParams.get("type");
  const typeFilter =
    bookType === "digital" || bookType === "physical" || bookType === "both" ?
      bookType
    : undefined;

  if (manage) {
    const authUser = await verifyBearerToken(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const scope = await resolveBookAdminScope(authUser.uid);
    if (!scope) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const [books, churches] = await Promise.all([
      listManagedBooks(scope, { query }),
      listChurchesForBookAdmin(scope),
    ]);
    return NextResponse.json({ books, churches, scopeKind: scope.kind });
  }

  const authUser = await optionalBooksAuth(request);
  const memberChurchIds = await listCatalogMemberChurchIds(authUser?.uid);

  const books = await listPublishedCatalogBooks({
    query,
    bookType: typeFilter,
    includeMembersOnlyForChurchIds: memberChurchIds,
  });
  return NextResponse.json({ books });
}

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
      { error: "You cannot publish books for this church." },
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

  try {
    const book = await createBook({
      organizationId: scope.organizationId,
      createdBy: scope.userId,
      data: parsed.data,
    });
    await notifyIfBookNewlyPublished({
      bookId: book.id,
      title: book.title,
      coverImageUrl: book.coverImageUrl,
      churchId: book.churchId,
      status: book.status,
      previousStatus: "draft",
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the book.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
