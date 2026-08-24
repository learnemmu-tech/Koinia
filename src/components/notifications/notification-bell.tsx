"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpen, CalendarDays, Church, HeartHandshake, Loader2, Music, Users } from "lucide-react";

import type { FirebaseNotification } from "@/types/firebase-notification";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type NotificationBellProps = {
  userId: string;
};

function NotificationTypeIcon({
  type,
  className,
}: {
  type: FirebaseNotification["type"];
  className?: string;
}) {
  switch (type) {
    case "article":
      return <BookOpen className={className} aria-hidden />;
    case "sermon":
      return <Church className={className} aria-hidden />;
    case "event":
      return <CalendarDays className={className} aria-hidden />;
    case "prayer":
    case "prayer_request_submitted":
      return <HeartHandshake className={className} aria-hidden />;
    case "membership_approved":
      return <Users className={className} aria-hidden />;
    default:
      return <Music className={className} aria-hidden />;
  }
}

export function NotificationBell({ userId }: NotificationBellProps) {
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <span className="relative inline-flex">
            <Bell className="size-4" />
            {unreadCount > 0 ?
              <Badge
                className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background px-1 text-[10px] font-semibold leading-none tabular-nums"
              >
                {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            : null}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((notification) => {
              const isUnread = !readIds.has(notification.id);

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "cursor-pointer items-start gap-3 rounded-none px-3 py-3",
                    isUnread && "bg-muted/40"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.image ? (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border/50">
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
                  ) : (
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <NotificationTypeIcon type={notification.type} className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <NotificationTypeIcon type={notification.type} className="size-3" />
                      {notification.title}
                    </p>
                    <p className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
                      {notification.contentTitle}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
