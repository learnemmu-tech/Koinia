import {
  getUserProfile,
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

export async function waitForUserProfileUpdate(
  uid: string,
  criteria: WorkspaceProfileCriteria,
  timeoutMs = 20000
): Promise<FirestoreUser | null> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const profile = await getUserProfile(uid, { fromServer: true });
    if (profile && profileMatchesCriteria(profile, criteria)) {
      return profile;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }

  return getUserProfile(uid, { fromServer: true });
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
