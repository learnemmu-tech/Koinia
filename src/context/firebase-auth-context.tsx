"use client";



import React from "react";

import { onAuthStateChanged, type User } from "firebase/auth";



import {

  clearUserCache,

  readUserCache,

  writeUserCache,

} from "@/lib/auth/user-cache";

import { setAuthSession } from "@/lib/auth/set-auth-session";

import { canAccessWorkspace } from "@/lib/auth/workspace-access";

import {

  createOrUpdateUserInFirestore,

  completeGoogleRedirectSignIn,

  firebaseAuth,

  getUserProfile,

  signOutUser,

  type FirestoreUser,

} from "@/lib/firebase-auth-service";

import {

  AUTH_ADMIN_COOKIE_NAME,

  AUTH_COOKIE_NAME,

  AUTH_ROLE_COOKIE_NAME,

} from "@/lib/auth-cookies";



/** Normalized Firebase auth user exposed to the app */

export type AuthUser = {

  uid: string;

  email: string | null;

  displayName: string | null;

  photoURL: string | null;

};



type FirebaseAuthContextType = {

  user: User | null;

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



function toAuthUser(firebaseUser: User): AuthUser {

  return {

    uid: firebaseUser.uid,

    email: firebaseUser.email,

    displayName: firebaseUser.displayName,

    photoURL: firebaseUser.photoURL,

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

  firebaseUser: User,

  userProfile: FirestoreUser | null,

  isAdmin: boolean

) {

  writeUserCache({

    uid: firebaseUser.uid,

    email: firebaseUser.email,

    displayName: firebaseUser.displayName,

    photoURL: firebaseUser.photoURL,

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



async function resolveFirebaseUser(firebaseUser: User): Promise<User> {

  if (firebaseUser.photoURL) return firebaseUser;



  const isGoogle = firebaseUser.providerData.some(

    (provider) => provider.providerId === "google.com"

  );



  if (!isGoogle) return firebaseUser;



  try {

    await firebaseUser.reload();

    return firebaseAuth.currentUser ?? firebaseUser;

  } catch {

    return firebaseUser;

  }

}



async function loadUserProfile(firebaseUser: User): Promise<FirestoreUser | null> {

  const existing = await getUserProfile(firebaseUser.uid);

  if (existing) return existing;

  return createOrUpdateUserInFirestore(firebaseUser);

}



export function FirebaseAuthProvider({

  children,

}: {

  children: React.ReactNode;

}) {

  const [user, setUser] = React.useState<User | null>(null);

  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  const [profile, setProfile] = React.useState<FirestoreUser | null>(null);

  const [isAdmin, setIsAdmin] = React.useState(false);

  const [loading, setLoading] = React.useState(true);

  const [profileReady, setProfileReady] = React.useState(false);



  React.useEffect(() => {

    void completeGoogleRedirectSignIn().catch(() => {

      // Redirect result absent or failed — onAuthStateChanged handles session.

    });

  }, []);



  React.useEffect(() => {

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {

      if (!firebaseUser) {

        setUser(null);

        setAuthUser(null);

        setProfile(null);

        setIsAdmin(false);

        clearUserCache();

        setAuthSession(false);

        setProfileReady(true);

        setLoading(false);

        return;

      }



      setUser(firebaseUser);

      setAuthUser(toAuthUser(firebaseUser));

      setProfileReady(false);

      setLoading(true);



      void (async () => {

        try {

          const [resolvedUser, userProfile] = await Promise.all([

            resolveFirebaseUser(firebaseUser),

            getUserProfile(firebaseUser.uid, { fromServer: true }).then(

              (profile) => profile ?? loadUserProfile(firebaseUser)

            ),

          ]);



          if (firebaseAuth.currentUser?.uid !== firebaseUser.uid) return;



          setUser(resolvedUser);

          setAuthUser(toAuthUser(resolvedUser));

          setProfile(userProfile);



          const { isAdmin: workspaceAccess } = resolveWorkspaceAccess(userProfile);

          setIsAdmin(workspaceAccess);

          persistSession(resolvedUser, userProfile, workspaceAccess);

        } catch {

          const cached = readUserCache(firebaseUser.uid);

          if (cached?.profile) {

            setProfile(cached.profile);

            setIsAdmin(cached.isAdmin);

            setAuthSession(true, {

              role: cached.profile.role ?? "user",

              profile: cached.profile,

              churchesCount: cached.profile.churchId ? 1 : 0,

            });

          } else {

            setProfile(null);

            setIsAdmin(false);

            setAuthSession(true, { role: "user" });

          }

        } finally {

          if (firebaseAuth.currentUser?.uid === firebaseUser.uid) {

            setProfileReady(true);

            setLoading(false);

          }

        }

      })();

    });



    return () => unsubscribe();

  }, []);



  const signOut = React.useCallback(async () => {

    await signOutUser();

    clearUserCache();

    setUser(null);

    setAuthUser(null);

    setProfile(null);

    setIsAdmin(false);

    setAuthSession(false);

  }, []);



  const refreshProfile = React.useCallback(async (patch?: Partial<FirestoreUser>) => {
    const current = firebaseAuth.currentUser;
    if (!current) return null;

    const serverProfile = await getUserProfile(current.uid, { fromServer: true });
    const userProfile =
      serverProfile && patch ? { ...serverProfile, ...patch } : serverProfile;

    setProfile(userProfile);

    if (userProfile) {
      const { isAdmin: workspaceAccess } = resolveWorkspaceAccess(userProfile);
      setIsAdmin(workspaceAccess);
      persistSession(current, userProfile, workspaceAccess);
    }

    return userProfile;
  }, []);



  return (

    <FirebaseAuthContext.Provider

      value={{ user, authUser, profile, isAdmin, loading, profileReady, signOut, refreshProfile }}

    >

      {children}

    </FirebaseAuthContext.Provider>

  );

}



export function useFirebaseAuth() {

  return React.useContext(FirebaseAuthContext);

}

