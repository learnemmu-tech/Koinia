import { format, isToday, isYesterday } from "date-fns";

import type { CommunityChatMessage } from "@/types/community-chat";

export function formatCommunityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = format(date, "h:mm a");
  if (isToday(date)) return time;
  if (isYesterday(date)) return `Yesterday ${time}`;
  return `${format(date, "MMM d")} ${time}`;
}

export function shouldGroupCommunityMessages(
  current: CommunityChatMessage | undefined,
  previous: CommunityChatMessage | undefined
): boolean {
  if (!current || !previous || previous.userId !== current.userId) return false;
  const gap =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return gap >= 0 && gap < 5 * 60 * 1000;
}
