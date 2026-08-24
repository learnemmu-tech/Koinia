import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseBranch } from "@/types/branch";

import { getLegacyDefaultChurchId } from "@/lib/church-scope";

export function getActiveOrgChurches(
  churches: FirebaseChurch[] | undefined
): FirebaseChurch[] {
  return (churches ?? []).filter((church) => church.isActive);
}

export function resolveEffectiveChurchId(input: {
  profile?: FirestoreUser | null;
  activeChurchId?: string | null;
  orgChurches?: FirebaseChurch[];
  allowLegacyDefault?: boolean;
}): string {
  const profileChurchId = input.profile?.churchId?.trim() || "";
  const activeChurchId = input.activeChurchId?.trim() || "";
  const orgChurchIds = getActiveOrgChurches(input.orgChurches).map(
    (church) => church.id
  );

  if (profileChurchId && orgChurchIds.includes(profileChurchId)) {
    return profileChurchId;
  }
  if (activeChurchId && orgChurchIds.includes(activeChurchId)) {
    return activeChurchId;
  }
  if (orgChurchIds[0]) return orgChurchIds[0];
  if (profileChurchId) return profileChurchId;
  if (activeChurchId) return activeChurchId;
  if (input.allowLegacyDefault !== false) {
    return getLegacyDefaultChurchId() || "";
  }
  return "";
}

export function resolveEffectiveBranchId(input: {
  profile?: FirestoreUser | null;
  activeBranchId?: string | null;
  churchId?: string | null;
  branchesByChurch?: Record<string, FirebaseBranch[]>;
  churches?: FirebaseChurch[];
}): string {
  const churchId = input.churchId?.trim() || "";
  const profileBranchId = input.profile?.activeBranchId?.trim() || "";
  const activeBranchId = input.activeBranchId?.trim() || "";
  const branches =
    churchId ? (input.branchesByChurch?.[churchId] ?? []) : [];
  const activeBranches = branches.filter((branch) => branch.isActive);
  const branchIds = activeBranches.map((branch) => branch.id);

  if (profileBranchId && branchIds.includes(profileBranchId)) {
    return profileBranchId;
  }
  if (activeBranchId && branchIds.includes(activeBranchId)) {
    return activeBranchId;
  }

  const church = input.churches?.find((item) => item.id === churchId);
  const defaultFromChurch = church?.defaultBranchId?.trim();
  if (defaultFromChurch && branchIds.includes(defaultFromChurch)) {
    return defaultFromChurch;
  }

  const defaultBranch =
    activeBranches.find((branch) => branch.isDefault) ?? activeBranches[0];
  return defaultBranch?.id ?? "";
}
