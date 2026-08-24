import type { FirestoreUser } from "@/lib/firebase-auth-service";

const CACHE_KEY = "fch_user";
const CACHE_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes

export type CachedUserSession = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profile: FirestoreUser | null;
  isAdmin: boolean;
  cachedAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readUserCache(uid?: string): CachedUserSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as CachedUserSession;
    if (!data?.uid || !data.cachedAt) return null;
    if (uid && data.uid !== uid) return null;

    const age = Date.now() - data.cachedAt;
    if (age > CACHE_MAX_AGE_MS) return null;

    return data;
  } catch {
    return null;
  }
}

export function writeUserCache(session: CachedUserSession): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable — non-blocking
  }
}

export function clearUserCache(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
