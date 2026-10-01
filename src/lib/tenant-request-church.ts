import { isPostgresUuid } from "@/lib/postgres/uuid";

/** Optional church scope from a member request. Membership is still enforced. */
export function churchIdFromRequest(
  request: Request,
  body?: Record<string, unknown>
): string | undefined {
  const header = request.headers.get("x-fch-church-id")?.trim() ?? "";
  const query = new URL(request.url).searchParams.get("churchId")?.trim() ?? "";
  const fromBody =
    typeof body?.churchId === "string" ? body.churchId.trim() : "";
  const value = header || query || fromBody;
  return value && isPostgresUuid(value) ? value : undefined;
}
