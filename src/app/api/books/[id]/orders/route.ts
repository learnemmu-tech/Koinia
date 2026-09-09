import { NextResponse } from "next/server";

import { canOrderPhysicalBook } from "@/lib/books/access";
import { userCanAccessBookAsMember } from "@/lib/books/admin-scope";
import { createPhysicalOrderSchema } from "@/lib/books/validation";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { createBookOrder } from "@/lib/postgres/book-orders";
import { decrementPhysicalStock, getBookById } from "@/lib/postgres/books";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });
  }

  const appUser = await getAppUserByClerkId(authUser.uid);
  if (!appUser) {
    return NextResponse.json({ error: "Account not found." }, { status: 401 });
  }

  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  if (book.visibility === "members_only") {
    const isMember = await userCanAccessBookAsMember(authUser.uid, book);
    if (!isMember) {
      return NextResponse.json(
        { error: "This book is available to church members only." },
        { status: 403 }
      );
    }
  }

  if (!canOrderPhysicalBook(book) || !book.physical) {
    return NextResponse.json(
      { error: "This physical edition is not available to order." },
      { status: 400 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createPhysicalOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order details." },
      { status: 400 }
    );
  }

  const quantity = parsed.data.quantity;
  if (quantity > book.physical.stockQuantity) {
    return NextResponse.json({ error: "Not enough stock for this quantity." }, { status: 400 });
  }

  const reserved = await decrementPhysicalStock(book.id, quantity);
  if (!reserved) {
    return NextResponse.json({ error: "Not enough stock for this quantity." }, { status: 400 });
  }

  const subtotalCents = book.physical.priceCents * quantity;
  const shippingCents = 0;
  const order = await createBookOrder({
    organizationId: book.organizationId,
    churchId: book.churchId,
    bookId: book.id,
    buyerUserId: appUser.id,
    quantity,
    currency: book.physical.currency,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    shippingName: parsed.data.shippingName,
    shippingPhone: parsed.data.shippingPhone,
    addressLine1: parsed.data.addressLine1,
    addressLine2: parsed.data.addressLine2,
    city: parsed.data.city,
    region: parsed.data.region,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
    notes: parsed.data.notes,
  });

  return NextResponse.json({ order }, { status: 201 });
}
