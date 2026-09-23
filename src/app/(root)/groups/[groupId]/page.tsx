import { notFound } from "next/navigation";

import { GroupDetailClient } from "@/components/groups/group-detail-client";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { listGroupMessages } from "@/lib/postgres/group-chat";
import { getChurchGroupDetail, GroupAccessError } from "@/lib/postgres/groups";
import { auth } from "@clerk/nextjs/server";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await auth();
  if (!session.userId) notFound();

  try {
    const group = await getChurchGroupDetail({
      clerkId: session.userId,
      email: session.sessionClaims?.email as string | undefined,
      groupId,
    });

    const appUser = await getAppUserByClerkId(session.userId);
    const chat =
      group.isMember
        ? await listGroupMessages({
            clerkId: session.userId,
            groupId,
          }).catch(() => ({ messages: [], hasMore: false }))
        : { messages: [], hasMore: false };

    return (
      <GroupDetailClient
        initialGroup={group}
        initialMessages={chat.messages}
        initialHasMore={chat.hasMore}
        currentUserId={appUser?.id ?? ""}
      />
    );
  } catch (error) {
    if (error instanceof GroupAccessError && error.code === "not_found") {
      notFound();
    }
    throw error;
  }
}
