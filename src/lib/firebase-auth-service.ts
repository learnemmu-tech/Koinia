import { POST_AUTH_CONTINUE_PATH } from "@/lib/auth/auth-paths";
import type { EmailNotificationPreferences } from "@/lib/email/types";
import { normalizeEmailPreferences } from "@/lib/email/preferences";

export type UserRole = "user" | "admin";

export type ChurchRole = "member" | "admin";

export type FirestoreUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  needsChurchOnboarding?: boolean;
  churchId?: string;
  activeBranchId?: string;
  /** Set when a member requests to join via URL and awaits owner approval. */
  pendingBranchId?: string;
  churchRole?: ChurchRole;
  managedChurchIds?: string[];
  emailPreferences?: EmailNotificationPreferences;
  createdAt: unknown;
};

/** Session identity compatible with former Firebase Auth `User` call sites. */
export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  reload: () => Promise<void>;
};

export type GoogleSignInResult =
  | { redirected: true }
  | { profile: FirestoreUser };

type ClerkEmailAddress = {
  emailAddress: string;
  verification: { status: string | null } | null;
  prepareVerification: (params: {
    strategy: string;
    redirectUrl?: string;
  }) => Promise<unknown>;
};

type ClerkBrowserUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  passwordEnabled: boolean;
  primaryEmailAddress: ClerkEmailAddress | null;
  emailAddresses: ClerkEmailAddress[];
  externalAccounts: Array<{ provider: string }>;
  reload: () => Promise<void>;
};

type ClerkSignInResource = {
  create: (params: Record<string, unknown>) => Promise<{
    status: string | null;
    createdSessionId: string | null;
  }>;
  authenticateWithRedirect: (params: Record<string, unknown>) => Promise<void>;
};

type SignUpAttempt = {
  status?: string | null;
  createdSessionId?: string | null;
  finalize?: () => Promise<unknown>;
  prepareEmailAddressVerification?: (
    params: Record<string, unknown>
  ) => Promise<unknown>;
  verifications?: {
    sendEmailCode?: () => Promise<unknown>;
    sendEmailLink?: (params: { verificationUrl: string }) => Promise<unknown>;
  };
};

type ClerkBrowser = {
  loaded?: boolean;
  user: ClerkBrowserUser | null;
  session: {
    getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>;
  } | null;
  client: {
    signIn: ClerkSignInResource;
    signUp: SignUpAttempt & {
      create?: (params: Record<string, unknown>) => Promise<unknown>;
      password?: (params: Record<string, unknown>) => Promise<unknown>;
      authenticateWithRedirect?: (params: Record<string, unknown>) => Promise<void>;
    };
  };
  setActive: (params: { session: string | null }) => Promise<void>;
  signOut: () => Promise<void>;
};

function throwClerkError(error: unknown): never {
  throw error;
}

async function runClerkAction(
  action: () => Promise<unknown>
): Promise<{ status?: string | null; createdSessionId?: string | null }> {
  try {
    const result = await action();
    if (result && typeof result === "object") {
      const outcome = result as {
        error?: unknown;
        status?: string | null;
        createdSessionId?: string | null;
      };
      if (outcome.error) throwClerkError(outcome.error);
      return {
        status: outcome.status ?? null,
        createdSessionId: outcome.createdSessionId ?? null,
      };
    }
    return {};
  } catch (error) {
    throwClerkError(error);
  }
}

function getClerk(): ClerkBrowser {
  if (typeof window === "undefined") {
    throw new Error("Authentication is only available in the browser.");
  }
  const clerk = (window as Window & { Clerk?: ClerkBrowser }).Clerk;
  if (!clerk?.client) {
    throw new Error("Authentication is still loading. Please try again.");
  }
  return clerk;
}

export function sessionUserFromClerk(
  clerk: ClerkBrowser = getClerk()
): SessionUser | null {
  const user = clerk.user;
  if (!user) return null;

  const primary = user.primaryEmailAddress ?? user.emailAddresses[0] ?? null;
  const providerData: Array<{ providerId: string }> = [];

  if (user.passwordEnabled) {
    providerData.push({ providerId: "password" });
  }

  for (const account of user.externalAccounts) {
    if (account.provider === "google") {
      providerData.push({ providerId: "google.com" });
    } else if (account.provider) {
      providerData.push({ providerId: account.provider });
    }
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    null;

  return {
    uid: user.id,
    email: primary?.emailAddress ?? null,
    displayName,
    photoURL: user.imageUrl ?? null,
    emailVerified: primary?.verification?.status === "verified",
    providerData,
    getIdToken: async () => {
      const token = await clerk.session?.getToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }
      return token;
    },
    reload: async () => {
      await user.reload();
      bindFirebaseAuthCurrentUser(sessionUserFromClerk(clerk));
    },
  };
}

export const firebaseAuth: { currentUser: SessionUser | null } = {
  currentUser: null,
};

export function bindFirebaseAuthCurrentUser(user: SessionUser | null) {
  firebaseAuth.currentUser = user;
}

export function mapFirestoreUserData(data: Record<string, unknown>): FirestoreUser {
  return {
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    email: String(data.email ?? ""),
    role: (data.role as UserRole) ?? "user",
    organizationId: data.organizationId ? String(data.organizationId) : undefined,
    needsChurchOnboarding: data.needsChurchOnboarding === true,
    churchId: data.churchId ? String(data.churchId) : undefined,
    activeBranchId: data.activeBranchId ? String(data.activeBranchId) : undefined,
    pendingBranchId: data.pendingBranchId ? String(data.pendingBranchId) : undefined,
    churchRole: data.churchRole as ChurchRole | undefined,
    managedChurchIds: Array.isArray(data.managedChurchIds)
      ? data.managedChurchIds.map(String)
      : undefined,
    emailPreferences: data.emailPreferences
      ? normalizeEmailPreferences(data.emailPreferences)
      : undefined,
    createdAt: data.createdAt,
  };
}

function isRetryableFetchError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message === "failed to fetch" ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}

async function syncProfileViaApi(
  user: SessionUser,
  options?: { firstName?: string; lastName?: string }
): Promise<FirestoreUser> {
  const token = await user.getIdToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }

  const request = (): Promise<Response> =>
    fetch("/api/auth/sync-profile", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: options?.firstName,
        lastName: options?.lastName,
      }),
    });

  let response: Response;
  try {
    response = await request();
  } catch (error) {
    if (!isRetryableFetchError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      response = await request();
    } catch {
      throw new Error("Failed to save user profile. Please try again.");
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(error?.error ?? "Failed to save user profile.");
  }

  return response.json() as Promise<FirestoreUser>;
}

export async function getUserProfile(
  uid: string,
  _options?: { fromServer?: boolean }
): Promise<FirestoreUser | null> {
  try {
    const user = firebaseAuth.currentUser;
    if (!user || user.uid !== uid) {
      return null;
    }
    const token = await user.getIdToken();
    const response = await fetch("/api/auth/sync-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return response.json() as Promise<FirestoreUser>;
  } catch {
    return null;
  }
}

export async function createOrUpdateUserInFirestore(
  user: SessionUser,
  options?: {
    firstName?: string;
    lastName?: string;
  }
): Promise<FirestoreUser> {
  return syncProfileViaApi(user, options);
}

export async function signInWithEmail(email: string, password: string) {
  const clerk = getClerk();
  const signIn = clerk.client.signIn as ClerkSignInResource & {
    password?: (params: Record<string, unknown>) => Promise<unknown>;
    finalize?: () => Promise<unknown>;
    status?: string | null;
    createdSessionId?: string | null;
  };

  if (typeof signIn.password === "function") {
    await runClerkAction(() =>
      signIn.password!({
        emailAddress: email,
        password,
      })
    );
    if (signIn.status === "complete" && typeof signIn.finalize === "function") {
      await runClerkAction(() => signIn.finalize!());
    } else if (signIn.status !== "complete") {
      throw new Error("Additional verification is required to sign in.");
    }
  } else {
    const result = await signIn.create({
      identifier: email,
      password,
    });

    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error("Additional verification is required to sign in.");
    }

    await clerk.setActive({ session: result.createdSessionId });
  }

  const user = sessionUserFromClerk(clerk);
  if (!user) {
    throw new Error("Signed in but user is unavailable.");
  }
  bindFirebaseAuthCurrentUser(user);
  return { user };
}

export async function finishSignUpAndSyncProfile(
  signUp: SignUpAttempt,
  options: { firstName: string; lastName: string }
) {
  if (signUp.status === "complete") {
    if (typeof signUp.finalize === "function") {
      await runClerkAction(() => signUp.finalize!());
    } else if (signUp.createdSessionId) {
      await getClerk().setActive({ session: signUp.createdSessionId });
    }
  } else {
    try {
      if (signUp.verifications?.sendEmailLink) {
        await runClerkAction(() =>
          signUp.verifications!.sendEmailLink!({
            verificationUrl: `${window.location.origin}/sso-callback`,
          })
        );
      } else {
        await signUp.prepareEmailAddressVerification?.({
          strategy: "email_link",
          redirectUrl: `${window.location.origin}/sso-callback`,
        });
      }
    } catch {
      try {
        if (signUp.verifications?.sendEmailCode) {
          await runClerkAction(() => signUp.verifications!.sendEmailCode!());
        } else {
          await signUp.prepareEmailAddressVerification?.({
            strategy: "email_code",
          });
        }
      } catch {
        // Verification may be disabled in the Clerk dashboard.
      }
    }

    if (signUp.status === "complete") {
      if (typeof signUp.finalize === "function") {
        await runClerkAction(() => signUp.finalize!());
      } else if (signUp.createdSessionId) {
        await getClerk().setActive({ session: signUp.createdSessionId });
      }
    } else if (signUp.createdSessionId) {
      await getClerk().setActive({ session: signUp.createdSessionId });
    }
  }

  const clerk = getClerk();
  const user = sessionUserFromClerk(clerk);
  if (!user) {
    throw new Error("Check your email to verify your account, then sign in.");
  }
  bindFirebaseAuthCurrentUser(user);

  const profile = await createOrUpdateUserInFirestore(user, options);
  return { result: { user }, profile };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const signUp = getClerk().client.signUp;
  const params = {
    emailAddress: email,
    password,
    firstName,
    lastName,
  };

  if (typeof signUp.password === "function") {
    await runClerkAction(() => signUp.password!(params));
  } else if (typeof signUp.create === "function") {
    await runClerkAction(() => signUp.create!(params));
  } else {
    throw new Error("Authentication is still loading. Please try again.");
  }

  return finishSignUpAndSyncProfile(signUp, { firstName, lastName });
}

function toAppPath(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim() || "/";
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    // Fall through to treat the value as a path.
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function postAuthContinueUrl(intended: string): string {
  const path = toAppPath(intended);
  if (
    path === POST_AUTH_CONTINUE_PATH ||
    path.startsWith(`${POST_AUTH_CONTINUE_PATH}?`)
  ) {
    return path;
  }
  return `${POST_AUTH_CONTINUE_PATH}?callbackUrl=${encodeURIComponent(path)}`;
}

export async function signInWithGoogle(options?: {
  redirectUrlComplete?: string;
}): Promise<GoogleSignInResult> {
  const clerk = getClerk();
  const redirectUrlComplete = postAuthContinueUrl(
    options?.redirectUrlComplete ||
      `${window.location.pathname}${window.location.search}` ||
      "/"
  );

  const oauthParams = {
    strategy: "oauth_google" as const,
    redirectUrl: "/sso-callback",
    redirectUrlComplete,
  };

  // Full-page redirect so Clerk can finish OAuth (including first-time Google sign-up)
  // on /sso-callback in this window. Popup OAuth left the opener without a session.
  if (
    window.location.pathname.startsWith("/signup") &&
    clerk.client.signUp.authenticateWithRedirect
  ) {
    try {
      await clerk.client.signUp.authenticateWithRedirect(oauthParams);
      return { redirected: true };
    } catch {
      // Existing Google accounts finish through sign-in instead.
    }
  }

  await clerk.client.signIn.authenticateWithRedirect(oauthParams);
  return { redirected: true };
}

export async function completeGoogleRedirectSignIn(): Promise<GoogleSignInResult | null> {
  return null;
}

export async function resetPassword(email: string) {
  const clerk = getClerk();
  await clerk.client.signIn.create({
    strategy: "reset_password_email_code",
    identifier: email,
  });
}

export async function sendSessionEmailVerification() {
  const clerk = getClerk();
  const email = clerk.user?.primaryEmailAddress;
  if (!email) {
    throw new Error("No email on this account.");
  }

  try {
    await email.prepareVerification({
      strategy: "email_link",
      redirectUrl: `${window.location.origin}/sso-callback`,
    });
  } catch {
    await email.prepareVerification({ strategy: "email_code" });
  }
}

export async function signOutUser() {
  const clerk = getClerk();
  await clerk.signOut();
  bindFirebaseAuthCurrentUser(null);
}
