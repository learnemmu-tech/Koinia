import "server-only";

import { canViewBook } from "@/lib/books/access";
import {
  resolveBookAdminScope,
  scopeAllowsBook,
  userCanAccessBookAsMember,
} from "@/lib/books/admin-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { userHasDigitalEntitlement } from "@/lib/postgres/books";
import type { BookRecord } from "@/types/book";

export async function getBookViewerContext(
  clerkId: string | null | undefined,
  book: BookRecord
) {
  const [isMember, appUser, scope] = await Promise.all([
    userCanAccessBookAsMember(clerkId, book),
    clerkId ? getAppUserByClerkId(clerkId) : Promise.resolve(null),
    clerkId ? resolveBookAdminScope(clerkId) : Promise.resolve(null),
  ]);
  const hasDigitalEntitlement = appUser
    ? await userHasDigitalEntitlement(appUser.id, book.id)
    : false;
  const canManage = Boolean(scope && scopeAllowsBook(scope, book));
  const canView =
    canManage ||
    canViewBook(book, {
      clerkId: clerkId ?? null,
      isMemberOfTenant: isMember,
      hasDigitalEntitlement,
    });

  return {
    clerkId: clerkId ?? null,
    isMember,
    hasDigitalEntitlement,
    canManage,
    canView,
  };
}
