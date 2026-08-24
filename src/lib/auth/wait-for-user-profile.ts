import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  getUserProfile,
  mapFirestoreUserData,
  type FirestoreUser,
} from "@/lib/firebase-auth-service";

export type WorkspaceProfileCriteria = {
  organizationId?: string;
  needsChurchOnboarding?: false;
};

function profileMatchesCriteria(
  profile: FirestoreUser,
  criteria: WorkspaceProfileCriteria
): boolean {
  if (criteria.organizationId?.trim()) {
    if (profile.organizationId?.trim() !== criteria.organizationId.trim()) {
      return false;
    }
  }

  if (
    criteria.needsChurchOnboarding === false &&
    profile.needsChurchOnboarding === true
  ) {
    return false;
  }

  return isWorkspaceProfileComplete(profile);
}

async function readProfileFromServer(uid: string): Promise<FirestoreUser | null> {
  const fromServer = await getUserProfile(uid, { fromServer: true });
  if (fromServer) return fromServer;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return null;
    return mapFirestoreUserData(userSnap.data());
  } catch {
    return null;
  }
}

/**
 * Waits until the Firestore user document reflects post-onboarding fields.
 * Uses server reads plus realtime updates; falls back to cached reads.
 */
export async function waitForUserProfileUpdate(
  uid: string,
  criteria: WorkspaceProfileCriteria,
  timeoutMs = 20000
): Promise<FirestoreUser | null> {
  const initial = await readProfileFromServer(uid);
  if (initial && profileMatchesCriteria(initial, criteria)) {
    return initial;
  }

  return new Promise((resolve) => {
    let settled = false;
    const userRef = doc(db, "users", uid);

    const finish = (profile: FirestoreUser | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      clearInterval(pollId);
      unsubscribe();
      resolve(profile);
    };

    const checkProfile = async (source: "snapshot" | "poll") => {
      if (settled) return;

      if (source === "snapshot") {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = mapFirestoreUserData(userSnap.data());
          if (profileMatchesCriteria(profile, criteria)) {
            finish(profile);
            return;
          }
        }
      }

      const profile = await readProfileFromServer(uid);
      if (profile && profileMatchesCriteria(profile, criteria)) {
        finish(profile);
      }
    };

    const timeoutId = window.setTimeout(() => finish(null), timeoutMs);
    const pollId = window.setInterval(() => {
      void checkProfile("poll");
    }, 1000);

    const unsubscribe = onSnapshot(
      userRef,
      () => {
        void checkProfile("snapshot");
      },
      () => finish(null)
    );
  });
}

export function isWorkspaceProfileComplete(profile: FirestoreUser | null): boolean {
  if (!profile) return false;
  if (profile.needsChurchOnboarding === true) return false;
  return Boolean(profile.organizationId?.trim());
}

export function buildPostOnboardingProfilePatch(input: {
  organizationId?: string;
  churchId?: string;
  activeBranchId?: string;
}): Partial<FirestoreUser> {
  return {
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    ...(input.churchId ? { churchId: input.churchId } : {}),
    ...(input.activeBranchId ? { activeBranchId: input.activeBranchId } : {}),
    needsChurchOnboarding: false,
  };
}
