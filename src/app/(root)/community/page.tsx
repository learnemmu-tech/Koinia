import type { Metadata } from "next";

import { CommunityPageClient } from "@/components/community/community-page-client";
import { getChurchById } from "@/lib/church-queries";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import {
  listCommunityMessages,
  userCanUseCommunityChat,
} from "@/lib/postgres/community-chat";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { listChurchGroups } from "@/lib/postgres/groups";
import { buildPageMetadata } from "@/lib/seo";
import { auth } from "@clerk/nextjs/server";
import { userCanManageChurch } from "@/lib/postgres/session";

export const metadata: Metadata = buildPageMetadata({
  title: "Community",
  description: "Church-wide conversation and groups on FaithConnectHub.",
  path: "/community",
});

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "groups" ? "groups" : "chat";
  const session = await auth();
  const email = session.sessionClaims?.email as string | undefined;
  const { tenantScope } = await resolvePageContentQuery();
  const churchId = tenantScope?.churchId ?? "";

  if (!session.userId || !churchId) {
    return (
      <CommunityPageClient
        churchId=""
        churchName="your church"
        canManage={false}
        canChat={false}
        initialGroups={[]}
        initialMessages={[]}
        initialHasMore={false}
        initialTab={initialTab}
        currentUserId=""
      />
    );
  }

  const [church, canManage, canChat, groups, chat, appUser] = await Promise.all([
    getChurchById(churchId),
    userCanManageChurch(session.userId, email, churchId),
    userCanUseCommunityChat(session.userId),
    initialTab === "groups"
      ? listChurchGroups({
          clerkId: session.userId,
          email,
          churchId,
        }).catch(() => [])
      : Promise.resolve([]),
    initialTab === "chat"
      ? listCommunityMessages({ clerkId: session.userId }).catch(() => ({
          messages: [],
          hasMore: false,
        }))
      : Promise.resolve({ messages: [], hasMore: false }),
    getAppUserByClerkId(session.userId),
  ]);

  return (
    <CommunityPageClient
      churchId={churchId}
      churchName={church?.name?.trim() || "your church"}
      churchLogoUrl={church?.logoUrl}
      canManage={canManage}
      canChat={canChat}
      initialGroups={groups}
      initialMessages={chat.messages}
      initialHasMore={chat.hasMore}
      initialTab={initialTab}
      currentUserId={appUser?.id ?? ""}
    />
  );
}
