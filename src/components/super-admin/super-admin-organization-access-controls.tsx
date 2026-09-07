"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  activateOrganizationAccessAction,
  suspendOrganizationAccessAction,
} from "@/lib/super-admin/access-actions";

export function SuperAdminOrganizationAccessControls({
  organizationId,
  accessStatus,
}: {
  organizationId: string;
  accessStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"suspend" | "activate" | null>(null);
  const isSuspended = accessStatus === "suspended";

  function runAction() {
    const action =
      dialog === "suspend"
        ? suspendOrganizationAccessAction
        : activateOrganizationAccessAction;
    const successMessage =
      dialog === "suspend"
        ? "Organization access suspended"
        : "Organization access activated";

    startTransition(async () => {
      const result = await action(organizationId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      {isSuspended ? (
        <Button type="button" onClick={() => setDialog("activate")}>
          Activate Access
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setDialog("suspend")}
        >
          Suspend Access
        </Button>
      )}

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === "activate"
                ? "Activate organization access?"
                : "Suspend organization access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "activate"
                ? "This will restore workspace access for members and administrators of this organization."
                : "This will prevent members and administrators of this organization from accessing their FaithConnectHub workspace. Existing data will not be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant={dialog === "activate" ? "default" : "destructive"}
              disabled={pending}
              onClick={runAction}
            >
              {pending
                ? "Saving…"
                : dialog === "activate"
                  ? "Activate Access"
                  : "Suspend Access"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
