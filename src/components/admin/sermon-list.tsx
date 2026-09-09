"use client";

import React, { useState } from "react";
import { Edit2, Loader2, Trash2, Church } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FirebaseSermon } from "@/types/firebase-sermon";

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
import { deleteSermon } from "@/lib/content-mutations-client";
import { getSongCoverUrl } from "@/lib/utils";

type SermonListProps = {
  sermons: FirebaseSermon[];
  loading: boolean;
  onEdit: (sermon: FirebaseSermon) => void;
  onDelete: () => void;
};

export function SermonList({
  sermons,
  loading,
  onEdit,
  onDelete,
}: SermonListProps) {
  const t = useTranslations("sermons");
  const tCommon = useTranslations("common");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<FirebaseSermon | null>(null);

  async function handleConfirmDelete() {
    if (!selected) return;
    setDeleting(selected.id);
    try {
      await deleteSermon(selected.id);
      toast.success(t("deletedSuccess"));
      onDelete();
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setSelected(null);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">{t("loadingAdmin")}</p>
        </div>
      </div>
    );
  }

  if (sermons.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Church className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("emptyAdminTitle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("emptyAdminDescription")}
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
              {t("allAdmin")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("itemCount", { count: sermons.length })}
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {sermons.map((sermon, index) => {
            const coverSrc = getSongCoverUrl(sermon.coverImage);
            const isDeleting = deleting === sermon.id;

            return (
              <div
                key={sermon.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-6 sm:py-3.5"
              >
                <span className="hidden w-5 shrink-0 text-center text-xs text-muted-foreground/50 sm:block">
                  {index + 1}
                </span>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                  <img
                    src={coverSrc}
                    alt={sermon.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SONG_COVER;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {sermon.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {sermon.scriptureReference || sermon.speaker || "Sermon"}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        sermon.isPublished
                          ? "bg-accent text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sermon.isPublished ? tCommon("published") : tCommon("draft")}
                    </span>
                  </div>
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {new Date(sermon.dateCreated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(sermon)}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tCommon("edit")}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelected(sermon);
                      setDeleteConfirmOpen(true);
                    }}
                    disabled={isDeleting}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{tCommon("delete")}</span>
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
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon("deleteConfirmNamed", { name: selected?.title ?? "" })}{" "}
              {tCommon("cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-full px-5">{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-full bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
