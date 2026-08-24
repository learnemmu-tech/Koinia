"use client";

import { memo, useMemo, useState } from "react";
import {
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import {
  deletePrayerRequest,
  updatePrayerRequestStatus,
} from "@/lib/prayer-request-mutations";
import { notifyIfPrayerApproved } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { getPrayerRequestDisplayName, formatPrayerDate } from "@/lib/prayer-request-firestore";
import { cn } from "@/lib/utils";

type PrayerRequestListProps = {
  requests: FirebasePrayerRequest[];
  loading: boolean;
};

type StatusFilter = PrayerRequestStatus | "all";

function StatusBadge({
  status,
  isAnswered,
}: {
  status: PrayerRequestStatus;
  isAnswered?: boolean;
}) {
  if (isAnswered) {
    return (
      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
        Answered
      </span>
    );
  }

  const styles: Record<PrayerRequestStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400",
    approved: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function PrayerRequestListInner({ requests, loading }: PrayerRequestListProps) {
  const { user } = useFirebaseAuth();
  const { invalidatePrayers } = useInvalidateAdminQueries();
  const tenantFields = useTenantNotifyFields();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirebasePrayerRequest | null>(
    null
  );

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  async function handleStatusChange(
    request: FirebasePrayerRequest,
    status: PrayerRequestStatus
  ) {
    setUpdatingId(request.id);
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
        status === "approved"
          ? "Prayer request approved"
          : "Prayer request rejected"
      );
      await invalidatePrayers();
    } catch {
      toast.error("Unable to update prayer request");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deletePrayerRequest(deleteTarget.id);
      toast.success("Prayer request deleted");
      await invalidatePrayers();
    } catch {
      toast.error("Failed to delete prayer request");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">
            Loading prayer requests…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as StatusFilter)}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/50 p-1 sm:grid-cols-4">
          <TabsTrigger value="pending" className="rounded-lg text-xs sm:text-sm">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg text-xs sm:text-sm">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg text-xs sm:text-sm">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          {filteredRequests.length === 0 ?
            <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <HeartHandshake className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No {filter === "all" ? "" : `${filter} `}prayer requests found.
                </p>
              </div>
            </div>
          : <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="border-b border-border/50 bg-muted/30 px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Prayer Requests
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filteredRequests.length}{" "}
                    {filteredRequests.length === 1 ? "request" : "requests"}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {filteredRequests.map((request) => {
                  const isUpdating = updatingId === request.id;
                  const isDeleting = deletingId === request.id;

                  return (
                    <div
                      key={request.id}
                      className="space-y-4 px-4 py-4 sm:px-6 sm:py-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              status={request.status}
                              isAnswered={request.isAnswered}
                            />
                            <span className="text-xs text-muted-foreground">
                              {formatPrayerDate(request.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-heading text-base font-semibold sm:text-lg">
                            {request.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getPrayerRequestDisplayName(request)}
                            {request.email ?
                              ` · ${request.email}`
                            : null}
                          </p>
                          <p className="text-sm leading-relaxed text-foreground/90">
                            {request.request}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.prayerCount.toLocaleString()} prayers recorded
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {request.status === "pending" ?
                            <>
                              <Button
                                size="sm"
                                disabled={isUpdating || isDeleting}
                                onClick={() =>
                                  handleStatusChange(request, "approved")
                                }
                                className="rounded-full"
                              >
                                <CheckCircle2 className="mr-1.5 size-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdating || isDeleting}
                                onClick={() =>
                                  handleStatusChange(request, "rejected")
                                }
                                className="rounded-full"
                              >
                                <XCircle className="mr-1.5 size-4" />
                                Reject
                              </Button>
                            </>
                          : null}

                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isUpdating || isDeleting}
                            onClick={() => setDeleteTarget(request)}
                            className="rounded-full text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-1.5 size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prayer request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteTarget?.title}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const PrayerRequestList = memo(PrayerRequestListInner);
