import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Centered loader for the main content region (beside sidebar, below header).
 * Not a global navigation indicator and not viewport-fixed.
 */
export function ContentAreaLoading({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Fill the visible main pane (viewport minus header + shell padding),
        // then center — avoids top-of-page / full-browser centering.
        "flex w-full flex-1 flex-col items-center justify-center gap-3",
        "min-h-[calc(100dvh-9rem)]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="size-6 animate-spin text-muted-foreground"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
