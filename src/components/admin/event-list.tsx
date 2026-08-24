"use client";

import React, { useState } from "react";
import { CalendarDays, Edit2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseEvent } from "@/types/firebase-event";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { formatEventDate } from "@/lib/event-firestore";
import { deleteEvent, updateEvent } from "@/lib/event-mutations";
import { notifyIfEventPublished } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { getSongCoverUrl } from "@/lib/utils";

type EventListProps = {
  events: FirebaseEvent[];
  loading: boolean;
  onEdit: (event: FirebaseEvent) => void;
  onDelete: () => void;
};

export function EventList({
  events,
  loading,
  onEdit,
  onDelete,
}: EventListProps) {
  const { user } = useFirebaseAuth();
  const tenantFields = useTenantNotifyFields();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<FirebaseEvent | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!selected) return;
    setDeleting(selected.id);
    try {
      await deleteEvent(selected.id);
      toast.success("Event deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setSelected(null);
    }
  }

  async function handlePublish(event: FirebaseEvent) {
    setPublishing(event.id);
    try {
      await updateEvent(event.id, { status: "published" });

      const idToken = user ? await user.getIdToken() : undefined;
      await notifyIfEventPublished({
        contentId: event.id,
        contentTitle: event.title,
        image: event.bannerImage,
        status: "published",
        wasStatus: event.status,
        idToken,
        churchId: event.churchId,
        organizationId: tenantFields.organizationId,
      });

      toast.success("Event published");
    } catch {
      toast.error("Failed to publish event");
    } finally {
      setPublishing(null);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Loading events…</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No events have been created for this church yet.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create your first ministry event to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              All Events
            </p>
            <p className="text-xs text-muted-foreground">
              {events.length} {events.length === 1 ? "event" : "events"}
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {events.map((event, index) => {
            const coverSrc = getSongCoverUrl(event.bannerImage);
            const isDeleting = deleting === event.id;
            const isPublishing = publishing === event.id;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-6 sm:py-3.5"
              >
                <span className="hidden w-5 shrink-0 text-center text-xs text-muted-foreground/50 sm:block">
                  {index + 1}
                </span>

                <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                  <img
                    src={coverSrc}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SONG_COVER;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {event.eventType}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        event.status === "published"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {formatEventDate(event.eventDate)}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  {event.status === "draft" ?
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPublishing}
                      onClick={() => handlePublish(event)}
                      className="h-8 rounded-lg px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      {isPublishing ?
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : "Publish"}
                    </Button>
                  : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(event)}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelected(event);
                      setDeleteConfirmOpen(true);
                    }}
                    disabled={isDeleting}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeleting ?
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selected?.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-full px-5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-full bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
