import { auth } from "@clerk/nextjs/server";

import { CommunityPageClient } from "@/components/community/community-page-client";
import { ShepherdChat } from "@/components/shepherd/shepherd-chat";
import { getChurchById } from "@/lib/church-queries";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  listCommunityMessages,
  userCanUseCommunityChat,
} from "@/lib/postgres/community-chat";
import { listChurchGroups } from "@/lib/postgres/groups";
import { userCanManageChurch } from "@/lib/postgres/session";
import { resolveShepherdUserContext } from "@/lib/shepherd/resolve-context";
import { HeritageActiveChurchSync } from "@/templates/heritage/components/heritage-member-app-redirect";
import { HeritageMemberGate } from "@/templates/heritage/components/heritage-member-gate";

export async function HeritageMemberChatPage({
  model,
  tab,
}: {
  model: ChurchWebsiteViewModel;
  tab?: string;
}) {
  const session = await auth();
  const churchId = model.church.id;
  const initialTab = tab === "groups" ? "groups" : "chat";

  if (!session.userId) {
    return <HeritageMemberGate model={model} featureLabel="Chat" />;
  }

  const email = session.sessionClaims?.email as string | undefined;
  const [church, canManage, canChat, groups, chat, appUser] = await Promise.all([
    getChurchById(churchId),
    userCanManageChurch(session.userId, email, churchId),
    userCanUseCommunityChat(session.userId, churchId),
    initialTab === "groups"
      ? listChurchGroups({
          clerkId: session.userId,
          email,
          churchId,
        }).catch(() => [])
      : Promise.resolve([]),
    initialTab === "chat"
      ? listCommunityMessages({
          clerkId: session.userId,
          churchId,
        }).catch(() => ({ messages: [], hasMore: false }))
      : Promise.resolve({ messages: [], hasMore: false }),
    getAppUserByClerkId(session.userId),
  ]);

  return (
    <>
      <HeritageActiveChurchSync churchId={churchId} />
      <CommunityPageClient
        churchId={churchId}
        churchName={church?.name?.trim() || model.church.name}
        churchLogoUrl={church?.logoUrl}
        canManage={canManage}
        canChat={canChat}
        initialGroups={groups}
        initialMessages={chat.messages}
        initialHasMore={chat.hasMore}
        initialTab={initialTab}
        currentUserId={appUser?.id ?? ""}
        basePath={churchWebsitePath(model.church.slug, "/community")}
        embed
      />
    </>
  );
}

export async function HeritageMemberShepherdPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const session = await auth();
  if (!session.userId) {
    return <HeritageMemberGate model={model} featureLabel="Shepherd AI" />;
  }

  const email = session.sessionClaims?.email as string | undefined;
  const context = await resolveShepherdUserContext(
    session.userId,
    email,
    model.church.id
  );
  if (!context) {
    return <HeritageMemberGate model={model} featureLabel="Shepherd AI" />;
  }

  return (
    <div className="min-h-[calc(100svh-4.75rem)]">
      <HeritageActiveChurchSync churchId={model.church.id} />
      <div className="shepherd-theme flex min-h-[calc(100svh-4.75rem)] flex-col">
        <ShepherdChat
          initialMode={context.mode}
          displayName={context.displayName}
          churchId={model.church.id}
        />
      </div>
    </div>
  );
}
