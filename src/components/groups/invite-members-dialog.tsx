"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import type { ChurchGroupInviteCandidate } from "@/types/church-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteGroupMember,
  regenerateGroupInviteLink,
  searchInviteCandidates,
} from "@/lib/groups-client";
import { resolveAppOrigin } from "@/lib/join-url";
import { cn } from "@/lib/utils";

type InviteMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  memberCount: number;
  pendingInvitationCount: number;
  inviteToken?: string;
  getToken: () => Promise<string | null>;
  onTokenChanged?: (token: string) => void;
  onInvited?: () => void;
};

export function InviteMembersDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  memberCount,
  pendingInvitationCount,
  inviteToken,
  getToken,
  onTokenChanged,
  onInvited,
}: InviteMembersDialogProps) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<ChurchGroupInviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const shareUrl = inviteToken ? `${resolveAppOrigin()}/g/${inviteToken}` : "";
  const memberLabel = `${memberCount} ${memberCount === 1 ? "member" : "members"}`;
  const pendingLabel =
    pendingInvitationCount > 0
      ? ` · ${pendingInvitationCount} pending ${pendingInvitationCount === 1 ? "invitation" : "invitations"}`
      : "";

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCandidates([]);
      return;
    }
    const trimmed = query.trim();
    const timer = window.setTimeout(() => {
      void (async () => {
        const token = await getToken();
        if (!token) return;
        setSearching(true);
        try {
          const results = await searchInviteCandidates(groupId, trimmed, token);
          setCandidates(results);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Search failed.");
        } finally {
          setSearching(false);
        }
      })();
    }, trimmed.length > 0 ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, query, groupId, getToken]);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Invite link copied.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function regenerate() {
    const token = await getToken();
    if (!token) return;
    setRegenerating(true);
    try {
      const result = await regenerateGroupInviteLink(groupId, token);
      onTokenChanged?.(result.inviteToken);
      toast.success("Invite link regenerated. The previous link no longer works.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not regenerate.");
    } finally {
      setRegenerating(false);
    }
  }

  async function invite(userId: string) {
    const token = await getToken();
    if (!token) return;
    setBusyId(userId);
    try {
      await inviteGroupMember(groupId, userId, token);
      setCandidates((prev) =>
        prev.map((item) =>
          item.userId === userId ? { ...item, state: "pending" } : item
        )
      );
      onInvited?.();
      toast.success("Invitation sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(85dvh,640px)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-[560px]"
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 px-5 pb-3 pt-5 pr-12">
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            {groupName} · {memberLabel}
            {pendingLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-5">
          <section className="space-y-2">
            <p className="text-sm font-medium">Share invite link</p>
            <div className="flex gap-2">
              <p
                className="min-w-0 flex-1 truncate rounded-xl border border-[#E6E8EC] bg-[#F6F7FB] px-3 py-2.5 text-xs text-muted-foreground"
                title={shareUrl}
              >
                {shareUrl || "Generating…"}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 rounded-xl"
                onClick={() => void copyLink()}
                disabled={!shareUrl}
                aria-label="Copy invite link"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-0 text-muted-foreground"
              onClick={() => void regenerate()}
              disabled={regenerating}
            >
              {regenerating ?
                <Loader2 className="size-4 animate-spin" />
              : null}
              Regenerate link
            </Button>
          </section>

          <section className="flex min-h-0 flex-1 flex-col">
            <Label htmlFor="group-member-search">Search members</Label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="group-member-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
                className="h-11 rounded-xl pl-9"
                autoComplete="off"
              />
            </div>
            <div className="mt-3 h-[280px] overflow-y-auto rounded-xl border border-border">
              {searching ?
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Searching…
                </p>
              : candidates.length === 0 ?
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {query.trim()
                    ? "No church members match that search."
                    : "No active church members to show."}
                </p>
              : <ul>
                  {candidates.map((person) => (
                    <li
                      key={person.userId}
                      className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {person.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.email}
                        </p>
                      </div>
                      {person.state === "member" ?
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Check className="size-3.5" aria-hidden />
                          Member
                        </span>
                      : person.state === "pending" ?
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          Pending
                        </span>
                      : <Button
                          type="button"
                          size="sm"
                          className="h-9 min-w-[5.5rem] shrink-0 rounded-lg"
                          disabled={busyId === person.userId}
                          onClick={() => void invite(person.userId)}
                        >
                          {busyId === person.userId ?
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Inviting...
                            </>
                          : "Invite"}
                        </Button>
                      }
                    </li>
                  ))}
                </ul>
              }
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
