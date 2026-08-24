import type { FirestoreUser } from "@/lib/firebase-auth-service";

import type { FirebaseMembership } from "@/types/membership";



import { sanitizeCallbackUrl } from "@/lib/callback-url";



import type { WorkspaceAccessInput } from "./workspace-access";

import { resolveMembershipRoutingDestination } from "./membership-routing";



export {

  ACCESS_DENIED_PATH,

  ACCOUNT_SUSPENDED_PATH,

  buildCreateWorkspaceAuthHref,

  buildInviteAuthHref,

  buildJoinAuthHref,

  CREATE_WORKSPACE_PATH,

  invitePathForToken,

  isInvitePath,

  isJoinPath,

  isOnboardingPath,

  isWaitingApprovalPath,

  joinPathForSlug,

  MEMBERSHIP_REMOVED_PATH,

  parseInviteTokenFromPath,

  parseJoinSlugFromPath,

  WAITING_APPROVAL_PATH,

} from "./auth-paths";



import { CREATE_WORKSPACE_PATH, isCreateWorkspacePath as isCreateWorkspacePathWithNormalize } from "./auth-paths";



export function isCreateWorkspacePath(path: string | null | undefined): boolean {

  return isCreateWorkspacePathWithNormalize(path, sanitizeCallbackUrl);

}



export type PostAuthInput = WorkspaceAccessInput & {

  profile: FirestoreUser | null;

  membership?: FirebaseMembership | null;

  churchesCount?: number;

  callbackUrl?: string | null;

  branchMemberships?: import("@/types/branch-membership").FirebaseBranchMembership[];

};



/**

 * Enterprise SaaS post-auth routing — membership status is authoritative.

 */

export function resolvePostAuthDestination(input: PostAuthInput): string {

  return resolveMembershipRoutingDestination(input);

}


