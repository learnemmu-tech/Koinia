"use client";

import React from "react";
import { useAuth, useUser } from "@clerk/nextjs";

import {
  clearUserCache,
  readUserCache,
  writeUserCache,
} from "@/lib/auth/user-cache";
import { setAuthSession } from "@/lib/auth/set-auth-session";
import { canAccessWorkspace } from "@/lib/auth/workspace-access";
import {
  bindFirebaseAuthCurrentUser,
  createOrUpdateUserInFirestore,
  firebaseAuth,
  signOutUser,
  type FirestoreUser,
  type SessionUser,
} from "@/lib/firebase-auth-service";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type FirebaseAuthContextType = {
  user: SessionUser | null;
  authUser: AuthUser | null;
  profile: FirestoreUser | null;
  /** True when user can access /dashboard (church workspace). */
  isAdmin: boolean;
  loading: boolean;
  /** False until the Firestore user profile has been loaded from the server. */
  profileReady: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (
    patch?: Partial<FirestoreUser>
  ) => Promise<FirestoreUser | null>;
};

const FirebaseAuthContext = React.createContext<FirebaseAuthContextType>({
  user: null,
  authUser: null,
  profile: null,
  isAdmin: false,
  loading: true,
  profileReady: false,
  signOut: async () => {},
  refreshProfile: async () => null,
});

export {
  AUTH_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  AUTH_ADMIN_COOKIE_NAME,
} from "@/lib/auth-cookies";

/** @deprecated Use setAuthSession from @/lib/auth/set-auth-session */
export function setAuthCookie(
  authenticated: boolean,
  options?: {
    role?: string;
    isAdmin?: boolean;
    profile?: FirestoreUser | null;
    membership?: import("@/types/membership").FirebaseMembership | null;
    churchesCount?: number;
  }
) {
  setAuthSession(authenticated, options);
}

function toAuthUser(sessionUser: SessionUser): AuthUser {
  return {
    uid: sessionUser.uid,
    email: sessionUser.email,
    displayName: sessionUser.displayName,
    photoURL: sessionUser.photoURL,
  };
}

function resolveWorkspaceAccess(profile: FirestoreUser | null) {
  const accessInput = {
    profile,
    churchesCount: profile?.churchId ? 1 : 0,
  };
  return {
    isAdmin: canAccessWorkspace(accessInput),
    churchesCount: accessInput.churchesCount,
  };
}

function persistSession(
  sessionUser: SessionUser,
  userProfile: FirestoreUser | null,
  isAdmin: boolean
) {
  writeUserCache({
    uid: sessionUser.uid,
    email: sessionUser.email,
    displayName: sessionUser.displayName,
    photoURL: sessionUser.photoURL,
    profile: userProfile,
    isAdmin,
    cachedAt: Date.now(),
  });

  setAuthSession(true, {
    role: userProfile?.role ?? "user",
    profile: userProfile,
    churchesCount: userProfile?.churchId ? 1 : 0,
  });
}

async function loadUserProfile(sessionUser: SessionUser): Promise<FirestoreUser> {
  return createOrUpdateUserInFirestore(sessionUser);
}

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [profile, setProfile] = React.useState<FirestoreUser | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [profileReady, setProfileReady] = React.useState(false);
  const syncedUidRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (!isSignedIn || !clerkUser) {
      bindFirebaseAuthCurrentUser(null);
      setUser(null);
      setAuthUser(null);
      setProfile(null);
      setIsAdmin(false);
      clearUserCache();
      setAuthSession(false);
      setProfileReady(true);
      setLoading(false);
      syncedUidRef.current = null;
      return;
    }

    const sessionUser: SessionUser = {
      uid: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      displayName:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        null,
      photoURL: clerkUser.imageUrl ?? null,
      emailVerified:
        clerkUser.primaryEmailAddress?.verification?.status === "verified",
      providerData: [
        ...(clerkUser.passwordEnabled ? [{ providerId: "password" }] : []),
        ...clerkUser.externalAccounts.map((account) => ({
          providerId:
            account.provider === "google" ? "google.com" : account.provider,
        })),
      ],
        getIdToken: async (forceRefresh) => {
          const token = await getToken({ skipCache: Boolean(forceRefresh) });
          if (!token) throw new Error("Not authenticated.");
          return token;
        },
      reload: async () => {
        await clerkUser.reload();
      },
    };

    bindFirebaseAuthCurrentUser(sessionUser);
    setUser(sessionUser);
    setAuthUser(toAuthUser(sessionUser));

    const uid = sessionUser.uid;
    if (syncedUidRef.current === uid) {
      return;
    }

    syncedUidRef.current = uid;

    const cached = readUserCache(uid);
    if (cached?.profile) {
      setProfile(cached.profile);
      setIsAdmin(cached.isAdmin);
      setAuthSession(true, {
        role: cached.profile.role ?? "user",
        profile: cached.profile,
        churchesCount: cached.profile.churchId ? 1 : 0,
      });
      setProfileReady(true);
      setLoading(false);
    } else {
      setProfileReady(false);
      setLoading(true);
    }

    void (async () => {
      try {
        const userProfile = await loadUserProfile(sessionUser);

        if (firebaseAuth.currentUser?.uid !== uid) return;

        setUser(sessionUser);
        setAuthUser(toAuthUser(sessionUser));
        setProfile(userProfile);

        const { isAdmin: workspaceAccess } = resolveWorkspaceAccess(userProfile);
        setIsAdmin(workspaceAccess);
        persistSession(sessionUser, userProfile, workspaceAccess);
      } catch (error) {
        console.error("[auth] Failed to synchronize application user", error);
        const cached = readUserCache(uid);
        if (cached?.profile) {
          setProfile(cached.profile);
          setIsAdmin(cached.isAdmin);
          setAuthSession(true, {
            role: cached.profile.role ?? "user",
            profile: cached.profile,
            churchesCount: cached.profile.churchId ? 1 : 0,
          });
        } else {
          const fallbackProfile: FirestoreUser = {
            firstName: clerkUser.firstName ?? "",
            lastName: clerkUser.lastName ?? "",
            email: sessionUser.email ?? "",
            role: "user",
            needsChurchOnboarding: true,
            createdAt: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
          setIsAdmin(false);
          setAuthSession(true, {
            role: "user",
            profile: fallbackProfile,
          });
        }
      } finally {
        if (firebaseAuth.currentUser?.uid === uid) {
          setProfileReady(true);
          setLoading(false);
        }
      }
    })();
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const signOut = React.useCallback(async () => {
    await signOutUser();
    bindFirebaseAuthCurrentUser(null);
    clearUserCache();
    setUser(null);
    setAuthUser(null);
    setProfile(null);
    setIsAdmin(false);
    setAuthSession(false);
  }, []);

  const refreshProfile = React.useCallback(
    async (patch?: Partial<FirestoreUser>) => {
      const current = user;
      if (!current) return null;

      try {
        const serverProfile = await createOrUpdateUserInFirestore(current);
        const userProfile =
          serverProfile && patch ? { ...serverProfile, ...patch } : serverProfile;

        setProfile(userProfile);

        if (userProfile) {
          const { isAdmin: workspaceAccess } =
            resolveWorkspaceAccess(userProfile);
          setIsAdmin(workspaceAccess);
          persistSession(current, userProfile, workspaceAccess);
        }

        return userProfile;
      } catch (error) {
        console.error("[auth] Failed to refresh application user", error);
        if (!patch) return null;

        const userProfile = profile ? { ...profile, ...patch } : null;
        if (userProfile) {
          const { isAdmin: workspaceAccess } =
            resolveWorkspaceAccess(userProfile);
          setIsAdmin(workspaceAccess);
          persistSession(current, userProfile, workspaceAccess);
          setProfile(userProfile);
        }
        return userProfile;
      }
    },
    [user, profile]
  );

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        authUser,
        profile,
        isAdmin,
        loading,
        profileReady,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return React.useContext(FirebaseAuthContext);
}
