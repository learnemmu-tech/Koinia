import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseBranch } from "@/types/branch";

import { pickCurrentChurchId } from "@/lib/organization/pick-current-church-id";

export function getActiveOrgChurches(
  churches: Pick<FirebaseChurch, "id" | "isActive">[] | undefined
): Pick<FirebaseChurch, "id" | "isActive">[] {
  return (churches ?? []).filter((church) => church.isActive);
}

export function resolveEffectiveChurchId(input: {
  profile?: Pick<FirestoreUser, "churchId"> | null;
  activeChurchId?: string | null;
  orgChurches?: Pick<FirebaseChurch, "id" | "isActive">[];
  allowLegacyDefault?: boolean;
}): string {
  const orgChurchIds = getActiveOrgChurches(input.orgChurches).map(
    (church) => church.id
  );

  const picked = pickCurrentChurchId({
    profileChurchId: input.profile?.churchId,
    cookieChurchId: input.activeChurchId,
    accessibleChurchIds: orgChurchIds,
  });
  if (picked) return picked;

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
