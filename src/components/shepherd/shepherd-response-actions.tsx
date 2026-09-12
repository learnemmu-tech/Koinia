"use client";

import { useEffect, useId, useState } from "react";
import {
  Bookmark,
  Check,
  Copy,
  Flag,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Feedback = "up" | "down" | null;

type Props = {
  content: string;
  interrupted?: boolean;
  disabled?: boolean;
  onRegenerate: () => void;
};

const REPORT_REASONS = [
  "Inaccurate Scripture or theology",
  "Offensive or inappropriate",
  "Not helpful",
  "Other",
] as const;

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function ActionIconButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        pressed && "bg-accent/70 text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function ShepherdResponseActions({
  content,
  interrupted = false,
  disabled = false,
  onRegenerate,
}: Props) {
  const reportTitleId = useId();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [speaking, setSpeaking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");

  const plain = content.trim();
  const hasText = Boolean(plain);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (!hasText || disabled) return;
    const ok = await copyText(plain);
    if (ok) {
      setCopied(true);
    } else {
      toast.error("Could not copy response.");
    }
  }

  function handleFeedback(next: "up" | "down") {
    setFeedback((prev) => (prev === next ? null : next));
  }

  function handleReadAloud() {
    if (!hasText || typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Read aloud is not supported in this browser.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function handleShare() {
    if (!hasText) return;

    const shareData = {
      title: "Shepherd AI response",
      text: plain.slice(0, 1200),
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }

    const ok = await copyText(plain);
    if (ok) {
      toast.success("Response copied — ready to share.");
    } else {
      toast.error("Could not share this response.");
    }
  }

  function handleSave() {
    toast.message("Save to library is coming soon.");
  }

  function submitReport() {
    // UI-only for now — structured for a future report endpoint.
    setReportOpen(false);
    setReportDetails("");
    setReportReason(REPORT_REASONS[0]);
    toast.success("Thanks — your report was noted.");
  }

  if (!hasText) return null;

  return (
    <>
      <div
        className={cn(
          "mt-2 flex max-w-full flex-wrap items-center gap-0.5",
          "text-muted-foreground"
        )}
        role="toolbar"
        aria-label="Shepherd response actions"
      >
        <ActionIconButton
          label={copied ? "Copied" : "Copy response"}
          disabled={disabled}
          onClick={() => void handleCopy()}
        >
          {copied ?
            <Check className="size-3.5 text-primary" aria-hidden />
          : <Copy className="size-3.5" aria-hidden />}
        </ActionIconButton>

        <ActionIconButton
          label={interrupted ? "Try again" : "Regenerate response"}
          disabled={disabled}
          onClick={onRegenerate}
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </ActionIconButton>

        {!interrupted ?
          <>
            <ActionIconButton
              label="Helpful"
              pressed={feedback === "up"}
              disabled={disabled}
              onClick={() => handleFeedback("up")}
            >
              <ThumbsUp
                className={cn("size-3.5", feedback === "up" && "fill-current")}
                aria-hidden
              />
            </ActionIconButton>

            <ActionIconButton
              label="Not helpful"
              pressed={feedback === "down"}
              disabled={disabled}
              onClick={() => handleFeedback("down")}
            >
              <ThumbsDown
                className={cn("size-3.5", feedback === "down" && "fill-current")}
                aria-hidden
              />
            </ActionIconButton>
          </>
        : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="More actions"
              aria-label="More response actions"
              disabled={disabled}
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
                "text-muted-foreground transition-colors",
                "hover:bg-accent/60 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              <MoreHorizontal className="size-3.5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleReadAloud();
              }}
            >
              {speaking ?
                <Square className="size-3.5 fill-current" />
              : <Volume2 className="size-3.5" />}
              {speaking ? "Stop reading" : "Read aloud"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void handleShare();
              }}
            >
              <Share2 className="size-3.5" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled
              title="Coming soon"
              onSelect={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <Bookmark className="size-3.5" />
              Save
              <span className="ml-auto text-[10px] text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setReportOpen(true);
              }}
            >
              <Flag className="size-3.5" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md" aria-labelledby={reportTitleId}>
          <DialogHeader>
            <DialogTitle id={reportTitleId}>Report response</DialogTitle>
            <DialogDescription>
              Tell us what went wrong. This stays on your device for now and
              does not send church or organization details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Reason
              <select
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              Details (optional)
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="mt-1.5"
                placeholder="Briefly describe the issue…"
                maxLength={500}
              />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submitReport}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
