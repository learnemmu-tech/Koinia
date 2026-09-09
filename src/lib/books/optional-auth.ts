import {
  verifyBearerToken,
  type VerifiedAuthUser,
} from "@/lib/email/verify-auth";

function hasClerkSessionCookie(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)(__session|__client_uat)=/.test(cookie);
}

/** Resolve identity for public book routes without forcing Clerk handshake. */
export async function optionalBooksAuth(
  request: Request
): Promise<VerifiedAuthUser | null> {
  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) {
    return verifyBearerToken(request);
  }
  if (!hasClerkSessionCookie(request)) return null;
  return verifyBearerToken(request);
}
