export {
  canAccessWorkspace,
  getSessionCookieHints,
  isChurchOwner,
  isOnboardingComplete,
  needsChurchOnboarding,
  resolveAccountType,
  type WorkspaceAccessInput,
} from "./workspace-access";

import {
  canAccessWorkspace,
  resolveAccountType,
  type WorkspaceAccessInput,
} from "./workspace-access";

export function shouldSetWorkspaceCookie(input: WorkspaceAccessInput): boolean {
  return canAccessWorkspace(input);
}

export function isChurchTeamMember(input: WorkspaceAccessInput): boolean {
  const type = resolveAccountType(input);
  return type === "church_owner" || type === "church_member";
}

/** @deprecated Use canAccessWorkspace */
export function canAccessAdminPanel(input: WorkspaceAccessInput): boolean {
  return canAccessWorkspace(input);
}
