/**
 * node-postgres currently treats sslmode=require/prefer/verify-ca as
 * verify-full and warns that pg v9 will switch those to weaker libpq
 * semantics. Keep today's verified TLS without changing credentials.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  return connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i,
    "$1sslmode=verify-full"
  );
}
