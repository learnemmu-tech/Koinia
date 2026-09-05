const POSTGRES_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the value can be bound to a PostgreSQL `uuid` column. */
export function isPostgresUuid(value: string | null | undefined): boolean {
  return POSTGRES_UUID_RE.test(value?.trim() ?? "");
}

export function postgresUuidOrEmpty(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return isPostgresUuid(trimmed) ? trimmed : "";
}
