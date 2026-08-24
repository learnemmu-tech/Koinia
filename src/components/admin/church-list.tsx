"use client";

import { useState } from "react";
import { Edit2, Loader2, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseChurch } from "@/types/firebase-church";

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
import {
  deleteChurch,
  setChurchActive,
} from "@/lib/church-mutations";

type ChurchListProps = {
  churches: FirebaseChurch[];
  loading: boolean;
  onEdit: (church: FirebaseChurch) => void;
  onChanged: () => void;
  onDeleteChurch?: (churchId: string) => Promise<void>;
};

export function ChurchList({
  churches,
  loading,
  onEdit,
  onChanged,
  onDeleteChurch,
}: ChurchListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirebaseChurch | null>(null);

  async function handleToggleActive(church: FirebaseChurch) {
    setBusyId(church.id);
    try {
      await setChurchActive(church.id, !church.isActive);
      toast.success(church.isActive ? "Church disabled" : "Church activated");
      onChanged();
    } catch {
      toast.error("Failed to update church status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      if (onDeleteChurch) {
        await onDeleteChurch(deleteTarget.id);
      } else {
        await deleteChurch(deleteTarget.id);
      }
      toast.success("Church deleted");
      onChanged();
    } catch {
      toast.error("Failed to delete church");
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (churches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No churches yet. Add your first church to begin multi-tenant setup.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {churches.map((church) => (
          <article
            key={church.id}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
          >
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-lg font-bold">
                    {church.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">/{church.slug}</p>
                </div>
                <span
                  className={
                    church.isActive
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600"
                      : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  }
                >
                  {church.isActive ? "Active" : "Disabled"}
                </span>
              </div>

              {church.city || church.pastorName ?
                <p className="text-xs text-muted-foreground">
                  {[church.city, church.state].filter(Boolean).join(", ")}
                  {church.pastorName ? ` · ${church.pastorName}` : ""}
                </p>
              : null}

              {church.description ?
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {church.description}
                </p>
              : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/40 px-4 py-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === church.id}
                onClick={() => onEdit(church)}
              >
                <Edit2 className="mr-1.5 size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === church.id}
                onClick={() => handleToggleActive(church)}
              >
                <Power className="mr-1.5 size-3.5" />
                {church.isActive ? "Disable" : "Enable"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busyId === church.id}
                onClick={() => setDeleteTarget(church)}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete church?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.name}. Content linked to this church will
              remain in Firestore until cleaned up manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
