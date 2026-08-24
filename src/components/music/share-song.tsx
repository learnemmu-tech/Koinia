"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, Check, MessageCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ShareSongButtonProps = {
  songTitle: string;
  /** Optional alternate title (e.g. translation or native-language title) */
  alternateTitle?: string;
  /** @deprecated use alternateTitle */
  teluguTitle?: string;
  songId: string;
  className?: string;
};

const secondaryActionClass =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-3 text-xs font-medium text-white hover:border-white hover:bg-white/10 sm:px-3.5 sm:text-sm";

export function ShareSongButton({
  songTitle,
  alternateTitle,
  teluguTitle,
  songId,
  className,
}: ShareSongButtonProps) {
  const subtitle = alternateTitle ?? teluguTitle;
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  const songUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/songs/${encodeURIComponent(songId)}`;

  const shareText = subtitle
    ? `🎵 ${songTitle}\n${subtitle}\n\n${songUrl}`
    : `🎵 ${songTitle}\n\n${songUrl}`;

  useEffect(() => {
    setHasNativeShare(typeof navigator.share === "function");
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: songTitle,
        text: subtitle ? `${songTitle} - ${subtitle}` : songTitle,
        url: songUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(songUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  // Mobile — native share sheet
  if (hasNativeShare) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn(className ?? secondaryActionClass)}
        onClick={handleNativeShare}
      >
        <Share2 className="size-3.5" />
        Share
      </Button>
    );
  }

  // Desktop — dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(className ?? secondaryActionClass)}
        >
          <Share2 className="size-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="size-4 text-green-500" /> : <Link2 className="size-4" />}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleWhatsApp}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageCircle className="size-4 text-green-600" />
          Share on WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async () => {
            await navigator.clipboard.writeText(shareText);
            toast.success("Copied with title!");
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Copy className="size-4" />
          Copy with title
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}