"use client";

import React, { useState } from "react";
import { Edit2, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseArticle } from "@/types/firebase-article";

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
import { deleteArticle } from "@/lib/firebase-article-queries";
import { getSongCoverUrl } from "@/lib/utils";

type ArticleListProps = {
  articles: FirebaseArticle[];
  loading: boolean;
  onEdit: (article: FirebaseArticle) => void;
  onDelete: () => void;
};

export function ArticleList({
  articles,
  loading,
  onEdit,
  onDelete,
}: ArticleListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<FirebaseArticle | null>(null);

  async function handleConfirmDelete() {
    if (!selected) return;
    setDeleting(selected.id);
    try {
      await deleteArticle(selected.id);
      toast.success("Article deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete article");
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
          <p className="text-sm text-muted-foreground">Loading articles…</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No articles have been created for this church yet.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add your first article to get started.
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
              All Articles
            </p>
            <p className="text-xs text-muted-foreground">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {articles.map((article, index) => {
            const coverSrc = getSongCoverUrl(article.coverImage);
            const isDeleting = deleting === article.id;

            return (
              <div
                key={article.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-6 sm:py-3.5"
              >
                <span className="hidden w-5 shrink-0 text-center text-xs text-muted-foreground/50 sm:block">
                  {index + 1}
                </span>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                  <img
                    src={coverSrc}
                    alt={article.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SONG_COVER;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {article.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {article.category}
                    </span>
                    {article.featured ? (
                      <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        Featured
                      </span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">
                      by {article.author}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        article.isPublished
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {article.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {new Date(article.dateCreated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(article)}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelected(article);
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
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
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
