"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { markPrayerRequestAnswered } from "@/lib/prayer-request-mutations";
import { cn } from "@/lib/utils";

type PrayerAnsweredBadgeProps = {
  className?: string;
};

export function PrayerAnsweredBadge({ className }: PrayerAnsweredBadgeProps) {
  return (
    <Badge
      className={cn(
        "border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:text-green-400",
        className
      )}
    >
      <CheckCircle2 className="mr-1 size-3.5" aria-hidden />
      Prayer Answered
    </Badge>
  );
}

type PrayerAnsweredButtonProps = {
  request: FirebasePrayerRequest;
  className?: string;
  onAnswered?: () => void;
};

export function PrayerAnsweredButton({
  request,
  className,
  onAnswered,
}: PrayerAnsweredButtonProps) {
  const { authUser } = useFirebaseAuth();
  const [submitting, setSubmitting] = useState(false);

  const isOwner = Boolean(
    authUser?.uid && request.userId && authUser.uid === request.userId
  );

  if (!isOwner) {
    return null;
  }

  if (request.isAnswered) {
    return <PrayerAnsweredBadge className={className} />;
  }

  async function handleMarkAnswered() {
    if (!authUser?.uid || submitting) return;

    setSubmitting(true);
    try {
      await markPrayerRequestAnswered(request.id, authUser.uid);
      toast.success("Praise God! Your prayer has been marked as answered.");
      onAnswered?.();
    } catch (error) {
      const message =
        error instanceof Error ?
          error.message
        : "Unable to mark this prayer as answered";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={submitting}
      onClick={handleMarkAnswered}
      className={cn("rounded-full", className)}
    >
      {submitting ?
        <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
      : <CheckCircle2 className="mr-1.5 size-4" aria-hidden />}
      Prayer Answered
    </Button>
  );
}
