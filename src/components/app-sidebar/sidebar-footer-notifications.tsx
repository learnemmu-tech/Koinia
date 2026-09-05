"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2 } from "lucide-react";

import type { FirebaseNotification } from "@/types/firebase-notification";

import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  getNotificationContentPath,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  subscribeToReadNotificationIds,
} from "@/lib/firebase-notification-queries";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

const footerIconClass =
  "relative flex size-7 shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover-hover:hover:bg-accent hover-hover:hover:text-foreground active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type SidebarFooterNotificationsProps = {
  userId: string;
  onNavigate?: () => void;
};

export function SidebarFooterNotifications({
  userId,
  onNavigate,
}: SidebarFooterNotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);

    const unsubscribeNotifications = subscribeToNotifications(
      userId,
      (items) => {
        setNotifications(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubscribeReads = subscribeToReadNotificationIds(userId, setReadIds);

    return () => {
      unsubscribeNotifications();
      unsubscribeReads();
    };
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.has(notification.id)).length,
    [notifications, readIds]
  );

  async function handleNotificationClick(notification: FirebaseNotification) {
    if (!readIds.has(notification.id)) {
      await markNotificationRead(userId, notification.id);
    }

    setOpen(false);
    onNavigate?.();
    router.push(getNotificationContentPath(notification));
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications
      .filter((notification) => !readIds.has(notification.id))
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;
    await markAllNotificationsRead(userId, unreadIds);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className={footerIconClass}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ?
            <span className="absolute right-0.5 top-0.5 flex size-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FF4444] text-[8px] font-semibold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ?
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          : null}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {loading ?
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        : notifications.length === 0 ?
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        : <ScrollArea className="max-h-80">
            {notifications.map((notification) => {
              const isUnread = !readIds.has(notification.id);

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "cursor-pointer items-start gap-3 rounded-none px-3 py-3",
                    isUnread && "bg-accent"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.image ?
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border">
                      <ImageWithFallback
                        src={notification.image}
                        fallback={DEFAULT_SONG_COVER}
                        width={40}
                        height={40}
                        sizes="40px"
                        alt={notification.contentTitle}
                        className="size-full object-cover"
                      />
                    </div>
                  : <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-foreground">
                      <Bell className="size-4" />
                    </div>}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {notification.title}
                    </p>
                    <p className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
                      {notification.contentTitle}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
