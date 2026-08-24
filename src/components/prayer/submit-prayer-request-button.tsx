"use client";

import { useState } from "react";
import { HandHeart } from "lucide-react";

import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PrayerRequestForm } from "./prayer-request-form";

type SubmitPrayerRequestButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary";
  label?: string;
};

export function SubmitPrayerRequestButton({
  className,
  size = "default",
  variant = "default",
  label = "Request Prayer",
}: SubmitPrayerRequestButtonProps) {
  const { authUser, loading } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (loading) return;

    if (!authUser) {
      openDialog("/prayer-requests", { redirectOnClose: false });
      return;
    }

    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn(
          "group inline-flex items-center justify-center gap-2 rounded-full font-medium",
          "shadow-sm transition-all duration-200 ease-out",
          "hover:shadow-md active:scale-[0.98]",
          className
        )}
        onClick={handleClick}
        disabled={loading}
      >
        <HandHeart
          className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
          aria-hidden
        />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share a Prayer Request</DialogTitle>
            <DialogDescription>
              Share your prayer need with the community. Requests are reviewed
              before appearing on the public prayer wall.
            </DialogDescription>
          </DialogHeader>

          {open ?
            <PrayerRequestForm
              variant="dialog"
              onCancel={() => setOpen(false)}
              onSuccess={() => {
                /* keep open to show success state */
              }}
            />
          : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
