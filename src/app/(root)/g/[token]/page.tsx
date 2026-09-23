import { GroupInviteLanding } from "@/components/groups/group-invite-landing";

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GroupInviteLanding token={token} />;
}
