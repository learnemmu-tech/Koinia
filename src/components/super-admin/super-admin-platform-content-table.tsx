"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  EyeOff,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperAdminEmptyPanel } from "@/components/super-admin/super-admin-section";
import { PlatformContentEditors } from "@/components/super-admin/super-admin-platform-content-editors";
import {
  deletePlatformContent,
  setPlatformContentPublished,
} from "@/lib/super-admin/platform-content-actions";
import { formatShortDate } from "@/lib/super-admin/labels";
import { parseShortCaption } from "@/lib/short-caption";
import type {
  PlatformContentPagedList,
  PlatformContentRow,
  PlatformContentTab,
  PlatformContentType,
} from "@/lib/super-admin/platform-content-queries";

const TYPE_LABELS: Record<PlatformContentType, string> = {
  songs: "Song",
  sermons: "Sermon",
  articles: "Article",
  shorts: "Short",
  events: "Event",
  donations: "Donation",
};

/** Column heading for the per-type secondary column. */
const SUBTITLE_LABELS: Record<PlatformContentType, string> = {
  songs: "Artist",
  sermons: "Speaker",
  articles: "Author",
  shorts: "Topic",
  events: "Location",
  donations: "Currency",
};

const PUBLISHED_LABELS: Record<PlatformContentType, [string, string]> = {
  songs: ["Published", "Draft"],
  sermons: ["Published", "Draft"],
  articles: ["Published", "Draft"],
  shorts: ["Public", "Hidden"],
  events: ["Published", "Draft"],
  donations: ["Active", "Inactive"],
};

function viewHref(row: PlatformContentRow): string | null {
  switch (row.type) {
    case "songs":
      return `/songs/${row.id}`;
    case "sermons":
      return `/sermons/${row.id}`;
    case "articles":
      return `/articles/${row.id}`;
    case "events":
      return `/events/${row.id}`;
    case "donations":
      return `/donations/${row.id}`;
    case "shorts":
      return `/shorts?short=${encodeURIComponent(row.id)}`;
  }
}

function displayTitle(row: PlatformContentRow): string {
  if (row.type === "shorts") {
    const parsed = parseShortCaption(row.title, row.subtitle);
    return parsed.title || "Untitled short";
  }
  return row.title?.trim() || "Untitled";
}

function displaySubtitle(row: PlatformContentRow): string {
  if (row.type === "shorts") {
    const parsed = parseShortCaption(row.title, row.subtitle);
    return parsed.topic || row.subtitle || "—";
  }
  return row.subtitle?.trim() || "—";
}

export function SuperAdminPlatformContentTable({
  list,
  tab,
}: {
  list: PlatformContentPagedList;
  tab: PlatformContentTab;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRow, setConfirmRow] = useState<PlatformContentRow | null>(null);
  const [editRow, setEditRow] = useState<PlatformContentRow | null>(null);

  function handlePublishToggle(row: PlatformContentRow) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await setPlatformContentPublished(
        row.type,
        row.id,
        !row.published
      );
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(row.published ? "Unpublished." : "Published.");
      router.refresh();
    });
  }

  function handleDelete(row: PlatformContentRow) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await deletePlatformContent(row.type, row.id);
      setBusyId(null);
      setConfirmRow(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${TYPE_LABELS[row.type]} deleted.`);
      router.refresh();
    });
  }

  if (list.total === 0) {
    return (
      <SuperAdminEmptyPanel
        title="No platform content found"
        description="Create showcase content for the public site, or clear the filters to see everything."
      />
    );
  }

  const showTypeColumn = tab === "all";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              {showTypeColumn ? (
                <TableHead>Type</TableHead>
              ) : (
                <TableHead>{SUBTITLE_LABELS[tab as PlatformContentType]}</TableHead>
              )}
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[52px] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((row) => {
              const href = viewHref(row);
              const [publishedLabel, draftLabel] = PUBLISHED_LABELS[row.type];
              const isBusy = pending && busyId === row.id;

              return (
                <TableRow key={`${row.type}-${row.id}`}>
                  <TableCell className="min-w-[200px] max-w-[380px] font-medium">
                    {href ? (
                      <Link href={href} className="hover:underline">
                        <span className="line-clamp-2">{displayTitle(row)}</span>
                      </Link>
                    ) : (
                      <span className="line-clamp-2">{displayTitle(row)}</span>
                    )}
                    {showTypeColumn ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {displaySubtitle(row)}
                      </p>
                    ) : null}
                  </TableCell>

                  {showTypeColumn ? (
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {TYPE_LABELS[row.type]}
                    </TableCell>
                  ) : (
                    <TableCell className="text-muted-foreground">
                      <span className="line-clamp-1">{displaySubtitle(row)}</span>
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge
                      variant={row.published ? "secondary" : "outline"}
                      className="font-normal"
                    >
                      {row.published ? publishedLabel : draftLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatShortDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatShortDate(row.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                          <span className="sr-only">
                            Actions for {displayTitle(row)}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {href ? (
                          <DropdownMenuItem asChild>
                            <Link href={href}>
                              <Eye className="size-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onSelect={() => setEditRow(row)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handlePublishToggle(row)}
                        >
                          {row.published ? (
                            <>
                              <EyeOff className="size-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Send className="size-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setConfirmRow(row)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmRow !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {confirmRow ? TYPE_LABELS[confirmRow.type].toLowerCase() : "item"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRow ? `“${displayTitle(confirmRow)}” ` : ""}
              will be permanently removed from the public FaithConnectHub
              showcase, along with its uploaded media. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                if (confirmRow) handleDelete(confirmRow);
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlatformContentEditors
        editRow={editRow}
        onClose={() => setEditRow(null)}
        onSaved={() => {
          setEditRow(null);
          router.refresh();
        }}
      />
    </div>
  );
}
