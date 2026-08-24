import type {
  FirebaseOrganization,
  WorkspaceType,
} from "@/types/organization";

export type { WorkspaceType };

export function getWorkspaceType(
  organization: FirebaseOrganization | null | undefined
): WorkspaceType {
  return organization?.settings?.workspaceType ?? "independent_church";
}

export function isIndependentChurchWorkspace(
  organization: FirebaseOrganization | null | undefined
): boolean {
  return getWorkspaceType(organization) === "independent_church";
}

export function isMultiChurchOrgWorkspace(
  organization: FirebaseOrganization | null | undefined
): boolean {
  return getWorkspaceType(organization) === "multi_church_org";
}
