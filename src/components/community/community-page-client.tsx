"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, UsersRound } from "lucide-react";

import type { ChurchGroupSummary } from "@/types/church-group";
import type { CommunityChatMessage } from "@/types/community-chat";
import { CommunityChatPanel } from "@/components/community/community-chat-panel";
import { GroupsPageClient } from "@/components/groups/groups-page-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { typePageTitleClass } from "@/lib/responsive-classes";

type CommunityPageClientProps = {
  churchId: string;
  churchName: string;
  churchLogoUrl?: string;
  canManage: boolean;
  canChat: boolean;
  initialGroups: ChurchGroupSummary[];
  initialMessages: CommunityChatMessage[];
  initialHasMore: boolean;
  initialTab: "chat" | "groups";
  currentUserId: string;
};

export function CommunityPageClient({
  churchId,
  churchName,
  churchLogoUrl,
  canManage,
  canChat,
  initialGroups,
  initialMessages,
  initialHasMore,
  initialTab,
  currentUserId,
}: CommunityPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "groups" ? "groups" : "chat";

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "chat") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(query ? `/community?${query}` : "/community", {
      scroll: false,
    });
  }

  const initials = churchName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      data-page-fullbleed
      className="flex h-full min-h-0 flex-col bg-background dark:bg-background"
    >
      <header className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-[87.5rem] flex-col gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-11 rounded-xl">
              {churchLogoUrl ?
                <AvatarImage src={churchLogoUrl} alt={churchName} />
              : null}
              <AvatarFallback className="rounded-xl bg-primary/10 font-heading text-sm text-primary">
                {initials || "CH"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 id="community-heading" className={typePageTitleClass}>
                Community
              </h1>
              <p className="truncate text-sm text-muted-foreground">{churchName}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setTab}>
            <TabsList
              aria-label="Community sections"
              className="h-10 w-full max-w-md justify-start rounded-xl bg-muted/70 p-1"
            >
              <TabsTrigger
                value="chat"
                className="h-8 flex-1 rounded-lg px-3 text-sm data-[state=active]:shadow-sm sm:flex-none"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Community Chat</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="h-8 flex-1 rounded-lg px-3 text-sm data-[state=active]:shadow-sm sm:flex-none"
              >
                <UsersRound className="size-3.5" aria-hidden />
                Groups
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div
        className={
          activeTab === "chat"
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "hidden"
        }
      >
        <CommunityChatPanel
          churchId={churchId}
          churchName={churchName}
          canChat={canChat}
          currentUserId={currentUserId}
          initialMessages={initialMessages}
          initialHasMore={initialHasMore}
        />
      </div>
      <div
        className={
          activeTab === "groups"
            ? "min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            : "hidden"
        }
      >
        <div className="mx-auto w-full max-w-[87.5rem]">
          <GroupsPageClient
            churchId={churchId}
            churchName={churchName}
            canManage={canManage}
            initialGroups={initialGroups}
            loadOnMount={initialTab !== "groups"}
            active={activeTab === "groups"}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
