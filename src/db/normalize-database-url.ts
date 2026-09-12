/**
 * node-postgres currently treats sslmode=require/prefer/verify-ca as
 * verify-full and warns that pg v9 will switch those to weaker libpq
 * semantics. Keep today's verified TLS without changing credentials.
 *
 * Neon: prefer the pooled endpoint at runtime. Direct endpoints open a new
 * compute connection per client and amplify fan-out latency under concurrent
 * Next.js API routes.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  let url = connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i,
    "$1sslmode=verify-full"
  );

  // ep-xxx.us-east-2.aws.neon.tech → ep-xxx-pooler.us-east-2.aws.neon.tech
  url = url.replace(
    /(@ep-[a-z0-9-]+)(\.(?:[a-z0-9-]+\.)*neon\.tech)/i,
    (match, userHost: string, rest: string) => {
      if (/-pooler$/i.test(userHost)) return match;
      return `${userHost}-pooler${rest}`;
    }
  );

  return url;
}
