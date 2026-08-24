"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ShareContentButtonProps = {
  title: string;
  path: string;
  description?: string;
};

export function ShareContentButton({
  title,
  path,
  description,
}: ShareContentButtonProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  const contentUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
  const shareText = description
    ? `${title}\n${description}\n\n${contentUrl}`
    : `${title}\n\n${contentUrl}`;

  useEffect(() => {
    setHasNativeShare(typeof navigator.share === "function");
  }, []);

  async function handleNativeShare() {
    try {
      await navigator.share({
        title,
        text: description ?? title,
        url: contentUrl,
      });
    } catch {
      // user cancelled
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(contentUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  }

  if (hasNativeShare) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-full px-4 text-sm"
        onClick={handleNativeShare}
      >
        <Share2 className="size-3.5" />
        Share
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full px-4 text-sm"
        >
          <Share2 className="size-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
          {copied ? <Check className="size-4 text-green-500" /> : <Link2 className="size-4" />}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer gap-2">
          <MessageCircle className="size-4 text-green-600" />
          Share on WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async () => {
            await navigator.clipboard.writeText(shareText);
            toast.success("Copied with title!");
          }}
          className="cursor-pointer gap-2"
        >
          <Copy className="size-4" />
          Copy with title
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
