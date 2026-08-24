import "server-only";

import { getAuth } from "firebase-admin/auth";

import { getAdminApp } from "@/lib/firebase-admin";

export type VerifiedAuthUser = {
  uid: string;
  email: string | undefined;
};

export async function verifyBearerToken(
  request: Request
): Promise<VerifiedAuthUser | null> {
  const adminApp = getAdminApp();
  if (!adminApp) return null;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice("Bearer ".length);
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
