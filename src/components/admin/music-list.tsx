// "use client";

// import React, { useState } from "react";
// import { Edit2, Trash2, Loader2 } from "lucide-react";
// import { toast } from "sonner";

// import type { FirebaseSong } from "@/types/firebase-song";
// import { DEFAULT_SONG_COVER } from "@/config/site";
// import { getSongCoverUrl } from "@/lib/utils";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { deleteSong } from "@/lib/firebase-queries";

// type MusicListProps = {
//   songs: FirebaseSong[];
//   loading: boolean;
//   onEdit: (song: FirebaseSong) => void;
//   onDelete: () => void;
// };

// export function MusicList({
//   songs,
//   loading,
//   onEdit,
//   onDelete,
// }: MusicListProps) {
//   const [deleting, setDeleting] = useState<string | null>(null);
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
//   const [selectedSong, setSelectedSong] = useState<FirebaseSong | null>(null);

//   function handleDeleteClick(song: FirebaseSong) {
//     setSelectedSong(song);
//     setDeleteConfirmOpen(true);
//   }

//   async function handleConfirmDelete() {
//     if (!selectedSong) return;

//     setDeleting(selectedSong.id);
//     try {
//       await deleteSong(selectedSong.id);
//       toast.success("Song deleted successfully");
//       onDelete();
//     } catch (error) {
//       console.error("Error deleting song:", error);
//       toast.error("Failed to delete song");
//     } finally {
//       setDeleting(null);
//       setDeleteConfirmOpen(false);
//       setSelectedSong(null);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }

//   if (songs.length === 0) {
//     return (
//       <div className="rounded-lg border border-dashed p-12 text-center">
//         <p className="text-muted-foreground">No songs yet. Add your first song!</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="overflow-hidden rounded-lg border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Cover</TableHead>
//               <TableHead>Title</TableHead>
//               <TableHead>Added</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {songs.map((song) => (
//               <TableRow key={song.id}>
//                 <TableCell>
//                   <img
//                     src={getSongCoverUrl(song.imageUrl)}
//                     alt={song.title}
//                     className="h-10 w-10 rounded object-cover"
//                     onError={(e) => {
//                       e.currentTarget.src = DEFAULT_SONG_COVER;
//                     }}
//                   />
//                 </TableCell>
//                 <TableCell className="font-medium">{song.title}</TableCell>
//                 <TableCell>
//                   {new Date(song.createdAt).toLocaleDateString()}
//                 </TableCell>
//                 <TableCell className="text-right">
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => onEdit(song)}
//                       className="gap-2"
//                     >
//                       <Edit2 className="h-4 w-4" />
//                       Edit
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       onClick={() => handleDeleteClick(song)}
//                       disabled={deleting === song.id}
//                       className="gap-2"
//                     >
//                       {deleting === song.id ?
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       : <Trash2 className="h-4 w-4" />}
//                       Delete
//                     </Button>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Song?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete &quot;{selectedSong?.title}&quot;?
//               This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <div className="flex justify-end gap-3">
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleConfirmDelete}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               Delete
//             </AlertDialogAction>
//           </div>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }


// Calude code
"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Loader2, Music2, FileText, Headphones, Star, EyeOff } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseSong } from "@/types/firebase-song";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { getSongCoverUrl } from "@/lib/utils";
import {
  getSongAlternateTitle,
  getSongDisplayTitle,
} from "@/lib/song-firestore";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteSong } from "@/lib/firebase-queries";

type MusicListProps = {
  songs: FirebaseSong[];
  loading: boolean;
  onEdit: (song: FirebaseSong) => void;
  onDelete: () => void;
};

export function MusicList({ songs, loading, onEdit, onDelete }: MusicListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<FirebaseSong | null>(null);

  function handleDeleteClick(song: FirebaseSong) {
    setSelectedSong(song);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!selectedSong) return;
    setDeleting(selectedSong.id);
    try {
      await deleteSong(selectedSong.id);
      toast.success("Song deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete song");
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setSelectedSong(null);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Loading songs…</p>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (songs.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Music2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No songs have been created for this church yet.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create your first song to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── List ── */
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {/* Table header */}
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              All Songs
            </p>
            <p className="text-xs text-muted-foreground">
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </p>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/40">
          {songs.map((song, index) => {
            const coverSrc = getSongCoverUrl(song.imageUrl);
            const hasAudio = !!song.audioUrl?.trim();
            const hasLyrics = !!(song.originalLyrics?.trim() || song.lyrics?.trim());
            const isDeleting = deleting === song.id;
            const displayTitle = getSongDisplayTitle(song);
            const alternateTitle = getSongAlternateTitle(song);

            return (
              <div
                key={song.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-6 sm:py-3.5"
              >
                {/* Index */}
                <span className="hidden w-5 shrink-0 text-center text-xs text-muted-foreground/50 sm:block">
                  {index + 1}
                </span>

                {/* Cover */}
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                  <img
                    src={coverSrc}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SONG_COVER;
                    }}
                  />
                </div>

                {/* Title + badges */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayTitle}
                  </p>
                  {alternateTitle ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {alternateTitle}
                    </p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {song.category}
                    </span>
                    {song.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        <Star className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    ) : null}
                    {!song.published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <EyeOff className="h-2.5 w-2.5" />
                        Draft
                      </span>
                    ) : null}
                    {hasAudio && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        <Headphones className="h-2.5 w-2.5" />
                        Audio
                      </span>
                    )}
                    {hasLyrics && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <FileText className="h-2.5 w-2.5" />
                        Lyrics
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {new Date(song.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(song)}
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(song)}
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

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="mt-2">Delete Song?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedSong ? getSongDisplayTitle(selectedSong) : ""}&quot;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-full px-5">
              Cancel
            </AlertDialogCancel>
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