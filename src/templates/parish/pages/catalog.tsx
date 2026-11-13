import { auth } from "@clerk/nextjs/server";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { BookRecord } from "@/types/book";
import type { FirebaseSong } from "@/types/firebase-song";
import { BooksCatalog } from "@/components/books/books-catalog";
import { CommunityPageClient } from "@/components/community/community-page-client";
import { SongsTabContent } from "@/components/worship/songs-tab-content";
import { getChurchById } from "@/lib/church-queries";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  listCommunityMessages,
  userCanUseCommunityChat,
} from "@/lib/postgres/community-chat";
import { listChurchGroups } from "@/lib/postgres/groups";
import { userCanManageChurch } from "@/lib/postgres/session";
import { ParishContentFrame } from "@/templates/parish/components/parish-frame";
import { ParishMemberGate } from "@/templates/parish/pages/site";

export async function ParishSongsPage({
  model,
  songs,
}: {
  model: ChurchWebsiteViewModel;
  songs: FirebaseSong[];
}) {
  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow="Worship"
      title="Songs"
      description={`Worship songs published by ${model.church.name}.`}
    >
      <SongsTabContent
        initialSongs={songs}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/songs")}
        showCollectionHeader={false}
      />
    </ParishContentFrame>
  );
}

export async function ParishBooksPage({
  model,
  books,
}: {
  model: ChurchWebsiteViewModel;
  books: BookRecord[];
}) {
  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow="Library"
      title="Books"
      description={`Books in the ${model.church.name} library.`}
    >
      <BooksCatalog books={books} hrefPrefix={churchWebsitePath(model.church.slug, "/books")} />
    </ParishContentFrame>
  );
}

export async function ParishCommunityPage({
  model,
  tab,
}: {
  model: ChurchWebsiteViewModel;
  tab?: string;
}) {
  const session = await auth();
  if (!session.userId) {
    return <ParishMemberGate model={model} featureLabel="Community" />;
  }

  const churchId = model.church.id;
  const email = session.sessionClaims?.email as string | undefined;
  const initialTab = tab === "groups" ? "groups" : "chat";
  const [church, canManage, canChat, groups, chat, appUser] = await Promise.all([
    getChurchById(churchId),
    userCanManageChurch(session.userId, email, churchId),
    userCanUseCommunityChat(session.userId, churchId),
    initialTab === "groups"
      ? listChurchGroups({ clerkId: session.userId, email, churchId }).catch(() => [])
      : Promise.resolve([]),
    initialTab === "chat"
      ? listCommunityMessages({ clerkId: session.userId, churchId }).catch(() => ({
          messages: [],
          hasMore: false,
        }))
      : Promise.resolve({ messages: [], hasMore: false }),
    getAppUserByClerkId(session.userId),
  ]);

  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow="Community"
      title="Community"
      description={`Conversations and groups at ${model.church.name}.`}
    >
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
    </ParishContentFrame>
  );
}

export function ParishShepherdPage({ model }: { model: ChurchWebsiteViewModel }) {
  return <ParishMemberGate model={model} featureLabel="Shepherd AI" />;
}
