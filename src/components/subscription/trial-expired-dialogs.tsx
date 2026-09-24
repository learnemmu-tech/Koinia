"use client";

import Link from "next/link";
import { Crown, FileText, Lock, PencilOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function TrialMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10",
        className
      )}
    >
      <FileText className="size-7 text-primary" aria-hidden />
      <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border border-background bg-primary text-primary-foreground shadow-sm">
        <Lock className="size-3" aria-hidden />
      </span>
    </div>
  );
}

export function TrialExpiredSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-2xl border-border/70 bg-card p-0 shadow-lg sm:max-w-[32rem]">
        <div className="px-6 pb-6 pt-10 text-center sm:px-8">
          <TrialMark />
          <DialogTitle className="mt-5 text-xl font-semibold tracking-tight sm:text-[1.35rem]">
            Your FaithConnectHub trial has ended
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your 14-day free trial has ended, but your church content is safe
            and still available to view.
          </DialogDescription>

          <ul className="mt-5 space-y-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-4 text-left text-sm">
            <li className="flex items-start gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>All your existing content remains safe and accessible.</span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>You can still view and share content.</span>
            </li>
            <li className="flex items-start gap-3">
              <PencilOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>Creating, editing, publishing, and uploading are currently disabled.</span>
            </li>
          </ul>

          <p className="mt-4 text-sm text-muted-foreground">
            Upgrade your plan to continue managing your church and unlock all
            features.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="sm:min-w-[10.5rem]"
              onClick={() => onOpenChange(false)}
            >
              Continue to Dashboard
            </Button>
            <Button asChild className="sm:min-w-[10.5rem]">
              <Link href="/pricing" onClick={() => onOpenChange(false)}>
                <Crown className="size-4" aria-hidden />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TrialExpiredActionDialog({
  open,
  onOpenChange,
  message,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-2xl border-border/70 bg-card p-0 shadow-lg sm:max-w-[28rem]">
        <div className="px-6 pb-6 pt-10 text-center sm:px-7">
          <TrialMark className="size-14" />
          <DialogTitle className="mt-4 text-xl font-semibold tracking-tight">
            Trial ended
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {message}
          </DialogDescription>
          <p className="mt-3 text-sm text-muted-foreground">
            Your existing church content remains safe and available to view.
            Upgrade your plan to continue creating and managing church content.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="sm:min-w-[8rem]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button asChild className="sm:min-w-[8rem]">
              <Link href="/pricing" onClick={() => onOpenChange(false)}>
                <Crown className="size-4" aria-hidden />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
