export type ChurchGroupStatus = "active" | "archived";
export type ChurchGroupInvitationStatus = "pending" | "accepted" | "declined";
export type ChurchGroupMemberRole = "owner" | "admin" | "member";

export type ChurchGroupMember = {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: ChurchGroupMemberRole;
  joinedAt: string;
};

export type ChurchGroupInviteCandidate = {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  state: "invite" | "member" | "pending";
};

export type ChurchGroupSummary = {
  id: string;
  organizationId: string;
  churchId: string;
  churchName: string;
  name: string;
  description: string;
  imageUrl: string | null;
  status: ChurchGroupStatus;
  memberCount: number;
  isMember: boolean;
  pendingInvitationId: string | null;
  canManage: boolean;
  canManageMembers: boolean;
  myRole: ChurchGroupMemberRole | null;
  createdByUserId: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type ChurchGroupDetail = ChurchGroupSummary & {
  members: ChurchGroupMember[];
  inviteToken?: string;
  pendingInvitationCount: number;
};
