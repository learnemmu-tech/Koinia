"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SharePrayerRequestButtonProps = {
  requestId: string;
  title: string;
  className?: string;
  /** Site-relative path to share. Defaults to the platform prayer route. */
  path?: string;
};

export function SharePrayerRequestButton({
  requestId,
  title,
  className,
  path,
}: SharePrayerRequestButtonProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  const sharePath = path ?? `/prayer-requests/${encodeURIComponent(requestId)}`;
  const requestUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath;

  useEffect(() => {
    setHasNativeShare(typeof navigator.share === "function");
  }, []);

  async function handleShare() {
    if (hasNativeShare) {
      try {
        await navigator.share({
          title,
          text: `Prayer request: ${title}`,
          url: requestUrl,
        });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(requestUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy link");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-full", className)}
      onClick={handleShare}
    >
      {copied ?
        <Check className="mr-2 size-4 text-emerald-500" />
      : <Share2 className="mr-2 size-4" />}
      {copied ? "Copied!" : "Share Prayer Request"}
    </Button>
  );
}
