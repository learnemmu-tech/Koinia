import { NextResponse } from "next/server";

import { resolveBookAdminScope } from "@/lib/books/admin-scope";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { listManagedBookOrders } from "@/lib/postgres/book-orders";

export async function GET(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scope = await resolveBookAdminScope(authUser.uid);
  if (!scope) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const orders = await listManagedBookOrders(scope);
  return NextResponse.json({ orders });
}
