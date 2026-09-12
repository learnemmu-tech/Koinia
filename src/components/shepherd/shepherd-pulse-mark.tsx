import { cn } from "@/lib/utils";
import { ShepherdIcon } from "@/components/shepherd/shepherd-icon";

/** Pulsing Shepherd mark for launcher, header, hero, and loading states. */
export function ShepherdPulseMark({
  className,
  iconClassName,
  size = "md",
  pulse = true,
}: {
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** When false, show a static mark (no breathing rings). */
  pulse?: boolean;
}) {
  // Badge is in the artwork — no extra colored disc.
  const shell =
    size === "sm" ? "size-9"
    : size === "lg" ? "size-14"
    : size === "xl" ? "size-[5.5rem] sm:size-24"
    : "size-10";

  return (
    <span
      className={cn(
        "shepherd-pulse-mark relative inline-flex shrink-0 items-center justify-center",
        shell,
        className
      )}
    >
      {pulse ?
        <>
          <span
            className="shepherd-launcher__pulse pointer-events-none absolute -inset-1 rounded-full bg-primary/15"
            aria-hidden
          />
          <span
            className="shepherd-launcher__pulse shepherd-launcher__pulse--delayed pointer-events-none absolute -inset-1 rounded-full bg-primary/8"
            aria-hidden
          />
        </>
      : null}
      <ShepherdIcon
        className={cn("relative z-[1] size-full", iconClassName)}
      />
    </span>
  );
}
