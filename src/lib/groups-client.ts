"use client";

import type {
  ChurchGroupDetail,
  ChurchGroupInviteCandidate,
  ChurchGroupSummary,
} from "@/types/church-group";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    const err = new Error(error?.error ?? `Request failed (${response.status})`);
    (err as Error & { code?: string }).code = error?.code;
    throw err;
  }
  return response.json() as Promise<T>;
}

function authHeaders(token?: string): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchChurchGroups(churchId: string, token: string) {
  const params = new URLSearchParams({ churchId });
  const response = await fetch(`/api/groups?${params.toString()}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await parseJson<{ groups: ChurchGroupSummary[] }>(response);
  return data.groups;
}

export async function createChurchGroup(
  input: { churchId: string; name: string; description?: string },
  token: string
) {
  const response = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  return parseJson<ChurchGroupSummary>(response);
}

export async function fetchChurchGroup(groupId: string, token: string) {
  const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  return parseJson<ChurchGroupDetail>(response);
}

export async function updateChurchGroup(
  groupId: string,
  input: { name?: string; description?: string; imageUrl?: string | null },
  token: string
) {
  const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  return parseJson<ChurchGroupSummary>(response);
}

export async function archiveChurchGroup(groupId: string, token: string) {
  const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseJson<{ success: boolean }>(response);
}

export async function searchInviteCandidates(
  groupId: string,
  query: string,
  token: string
) {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/invite-candidates?${params}`,
    { headers: authHeaders(token), cache: "no-store" }
  );
  const data = await parseJson<{ candidates: ChurchGroupInviteCandidate[] }>(
    response
  );
  return data.candidates;
}

export async function inviteGroupMember(
  groupId: string,
  userId: string,
  token: string
) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/invitations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ userId }),
    }
  );
  return parseJson<{ invitationId: string }>(response);
}

export async function respondToGroupInvitation(
  invitationId: string,
  action: "accept" | "decline",
  token: string
) {
  const response = await fetch(
    `/api/group-invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ action }),
    }
  );
  return parseJson<{ groupId: string; joined: boolean }>(response);
}

export async function leaveChurchGroup(groupId: string, token: string) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/leave`,
    { method: "POST", headers: authHeaders(token) }
  );
  return parseJson<{ success: boolean }>(response);
}

export async function updateChurchGroupMemberRole(
  groupId: string,
  userId: string,
  role: "admin" | "member",
  token: string
) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ role }),
    }
  );
  return parseJson<{ success: boolean; role: "admin" | "member" }>(response);
}

export async function transferChurchGroupOwnership(
  groupId: string,
  userId: string,
  token: string
) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ transferOwnership: true }),
    }
  );
  return parseJson<{ success: boolean; role: "owner" }>(response);
}

export async function removeChurchGroupMember(
  groupId: string,
  userId: string,
  token: string
) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE", headers: authHeaders(token) }
  );
  return parseJson<{ success: boolean }>(response);
}

export async function regenerateGroupInviteLink(groupId: string, token: string) {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupId)}/invite-link`,
    { method: "POST", headers: authHeaders(token) }
  );
  return parseJson<{ inviteToken: string }>(response);
}

export type GroupInvitePreview = {
  name: string;
  description: string;
  imageUrl: string | null;
  churchName: string;
  churchJoinSlug: string;
  canJoin: boolean;
};

export async function fetchGroupInvitePreview(token: string, authToken?: string) {
  const response = await fetch(
    `/api/groups/join/${encodeURIComponent(token)}`,
    { headers: authHeaders(authToken), cache: "no-store" }
  );
  return parseJson<GroupInvitePreview>(response);
}

export async function joinGroupByToken(inviteToken: string, authToken: string) {
  const response = await fetch(
    `/api/groups/join/${encodeURIComponent(inviteToken)}`,
    { method: "POST", headers: authHeaders(authToken) }
  );
  return parseJson<{ groupId: string; alreadyMember: boolean }>(response);
}
