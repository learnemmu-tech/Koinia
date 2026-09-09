import { NextResponse } from "next/server";

import { resolveBookAdminScope, scopeAllowsBook } from "@/lib/books/admin-scope";
import { updateFulfillmentSchema } from "@/lib/books/validation";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  getBookOrderById,
  updateBookOrderFulfillment,
} from "@/lib/postgres/book-orders";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const order = await getBookOrderById(id);
  if (!order || !scopeAllowsBook(scope, order)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
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

  const existing = await getBookOrderById(id);
  if (!existing || !scopeAllowsBook(scope, existing)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateFulfillmentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid fulfillment update." },
      { status: 400 }
    );
  }

  const order = await updateBookOrderFulfillment(id, parsed.data);
  return NextResponse.json({ order });
}
