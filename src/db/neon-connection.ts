import { spawnSync } from "node:child_process";
import { parse } from "pg-connection-string";

import { normalizeDatabaseUrl } from "./normalize-database-url";

const NEON_HOST = /@(?<host>ep-[a-z0-9-]+(?:\.[a-z0-9-]+)*\.neon\.tech)(?=[:/])/i;

export type NeonConnectionConfig = {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: { servername: string; rejectUnauthorized: true } | boolean;
};

function neonHostname(connectionString: string): string | null {
  return connectionString.match(NEON_HOST)?.groups?.host ?? null;
}

/** Public resolvers. Some local ISPs refuse *.neon.tech via getaddrinfo. */
function resolve4ViaPublicDns(hostname: string): string | null {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `const dns=require("node:dns");
const resolver=new dns.Resolver();
resolver.setServers(["1.1.1.1","1.0.0.1","8.8.8.8"]);
resolver.resolve4(process.argv[1],(error,addresses)=>{
  if(error||!addresses||!addresses[0]) process.exit(1);
  process.stdout.write(addresses[0]);
});`,
      hostname,
    ],
    { encoding: "utf8", timeout: 8_000, windowsHide: true }
  );
  const address = result.stdout?.trim() ?? "";
  return result.status === 0 && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)
    ? address
    : null;
}

/**
 * Keep the Neon hostname for certificate checks, but connect by an address
 * resolved through public DNS when the operating-system resolver cannot.
 *
 * The address is passed as `host`, not inside the connection string. pg copies
 * a parsed connection string over an explicit `ssl` option, which drops
 * `servername` and makes Node verify the certificate as `localhost`.
 */
export function neonConnectionConfig(connectionString: string): NeonConnectionConfig {
  const normalized = normalizeDatabaseUrl(connectionString);
  const hostname = neonHostname(normalized);
  if (!hostname) return { connectionString: normalized };

  const address = resolve4ViaPublicDns(hostname);
  if (!address) return { connectionString: normalized };

  const parsed = parse(normalized);
  return {
    host: address,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: parsed.user ?? undefined,
    password: parsed.password ?? undefined,
    database: parsed.database ?? undefined,
    ssl: { servername: hostname, rejectUnauthorized: true },
  };
}
