"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type {
  FirebasePrayerRequest,
  PrayerRequestStatus,
} from "@/types/firebase-prayer-request";

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
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { notifyIfPrayerApproved } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import {
  deletePrayerRequest,
  updatePrayerRequestStatus,
} from "@/lib/prayer-request-mutations";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PrayerRequestStatus, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-emerald-500/10 text-emerald-500",
  rejected: "bg-red-500/10 text-red-500",
};

export function PrayerModerationBar({
  request,
}: {
  request: FirebasePrayerRequest;
}) {
  const t = useTranslations("prayer");
  const tCommon = useTranslations("common");
  const { user } = useFirebaseAuth();
  const tenantFields = useTenantNotifyFields();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const busy = updating || deleting;

  const statusLabels: Record<PrayerRequestStatus, string> = {
    pending: tCommon("pending"),
    approved: tCommon("approved"),
    rejected: tCommon("rejected"),
  };

  async function handleStatusChange(status: PrayerRequestStatus) {
    setUpdating(true);
    try {
      await updatePrayerRequestStatus(request.id, status);
      const idToken = user ? await user.getIdToken() : undefined;
      await notifyIfPrayerApproved({
        contentId: request.id,
        contentTitle: request.title,
        previousStatus: request.status,
        newStatus: status,
        idToken,
        churchId: request.churchId || tenantFields.churchId,
        organizationId: tenantFields.organizationId,
      });
      toast.success(
        status === "approved" ? t("approveSuccess") : t("rejectSuccess")
      );
    } catch {
      toast.error(t("updateFailed"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePrayerRequest(request.id);
      toast.success(t("deletedSuccess"));
      setConfirmOpen(false);
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border/40 px-4 py-3">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_STYLES[request.status]
        )}
      >
        {statusLabels[request.status]}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {request.status !== "approved" ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => handleStatusChange("approved")}
            className="h-8 rounded-full px-3"
          >
            {updating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden />
            )}
            <span className="ml-1.5 text-xs">{tCommon("approve")}</span>
          </Button>
        ) : null}

        {request.status !== "rejected" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => handleStatusChange("rejected")}
            className="h-8 rounded-full px-3"
          >
            <XCircle className="size-3.5" aria-hidden />
            <span className="ml-1.5 text-xs">{tCommon("reject")}</span>
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
          className="h-8 rounded-full px-3 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          <span className="ml-1.5 text-xs">{tCommon("delete")}</span>
        </Button>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!deleting) setConfirmOpen(open);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { title: request.title })}{" "}
              {tCommon("cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-full px-5" disabled={deleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="rounded-full bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  {tCommon("deleting")}
                </>
              ) : (
                tCommon("delete")
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
