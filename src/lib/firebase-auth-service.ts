import {

  browserLocalPersistence,

  createUserWithEmailAndPassword,

  getAuth,

  getRedirectResult,

  GoogleAuthProvider,

  sendEmailVerification,

  sendPasswordResetEmail,

  setPersistence,

  signInWithEmailAndPassword,

  signInWithPopup,

  signInWithRedirect,

  signOut,

  type User,

  type UserCredential,

} from "firebase/auth";

import { doc, getDoc, getDocFromServer } from "firebase/firestore";



import { isMobileOrInAppBrowser } from "@/lib/auth/browser-detect";

import { app, db } from "./firebase";



export const firebaseAuth = getAuth(app);

void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
  // Persistence may fail in private browsing — auth still works for the session.
});



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



export type GoogleSignInResult =

  | { redirected: true }

  | { result: UserCredential; profile: FirestoreUser };



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



async function syncProfileViaApi(

  user: User,

  options?: { firstName?: string; lastName?: string }

): Promise<FirestoreUser> {

  const token = await user.getIdToken();

  const response = await fetch("/api/auth/sync-profile", {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

    },

    body: JSON.stringify({

      firstName: options?.firstName,

      lastName: options?.lastName,

    }),

  });



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
  options?: { fromServer?: boolean }
): Promise<FirestoreUser | null> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = options?.fromServer ?
      await getDocFromServer(userRef)
    : await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    return mapFirestoreUserData(data);
  } catch {
    return null;
  }
}



export async function createOrUpdateUserInFirestore(

  user: User,

  options?: {

    firstName?: string;

    lastName?: string;

  }

): Promise<FirestoreUser> {

  try {

    return await syncProfileViaApi(user, options);

  } catch {

    // Fallback to client Firestore if Admin API is unavailable

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);



    if (!userSnap.exists()) {

      const displayName = user.displayName ?? "";

      const parts = displayName.split(" ");

      const defaultFirst = parts[0] ?? "";

      const defaultLast = parts.slice(1).join(" ");



      const profile = {

        firstName: options?.firstName ?? defaultFirst,

        lastName: options?.lastName ?? defaultLast,

        email: user.email ?? "",

        role: "user" as const,

        needsChurchOnboarding: true,

        createdAt: new Date().toISOString(),

      };



      const { setDoc } = await import("firebase/firestore");

      await setDoc(userRef, profile);

      return profile;

    }



    const data = userSnap.data();

    return mapFirestoreUserData(data);

  }

}



export async function signInWithEmail(email: string, password: string) {

  return signInWithEmailAndPassword(firebaseAuth, email, password);

}



export async function signUpWithEmail(

  email: string,

  password: string,

  firstName: string,

  lastName: string

) {

  const result = await createUserWithEmailAndPassword(

    firebaseAuth,

    email,

    password

  );



  await sendEmailVerification(result.user);



  const profile = await createOrUpdateUserInFirestore(result.user, {

    firstName,

    lastName,

  });

  return { result, profile };

}



export async function signInWithGoogle(): Promise<GoogleSignInResult> {

  const provider = new GoogleAuthProvider();



  if (isMobileOrInAppBrowser()) {

    await signInWithRedirect(firebaseAuth, provider);

    return { redirected: true };

  }



  const result = await signInWithPopup(firebaseAuth, provider);

  const profile = await createOrUpdateUserInFirestore(result.user);

  return { result, profile };

}



export async function completeGoogleRedirectSignIn(): Promise<GoogleSignInResult | null> {

  const result = await getRedirectResult(firebaseAuth);

  if (!result) return null;



  const profile = await createOrUpdateUserInFirestore(result.user);

  return { result, profile };

}



export async function resetPassword(email: string) {

  return sendPasswordResetEmail(firebaseAuth, email);

}



export async function signOutUser() {

  return signOut(firebaseAuth);

}

