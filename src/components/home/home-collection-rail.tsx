import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HomeCollectionRailProps = {
  children: ReactNode;
  className?: string;
};

/** Mobile: ~one card + peek of the next. Desktop: grid column width via md:w-full. */
export const HOME_RAIL_LANDSCAPE =
  "w-[76vw] max-w-[17.5rem] flex-[0_0_min(76vw,17.5rem)] sm:w-[16rem] sm:flex-[0_0_16rem] md:w-full md:max-w-none md:flex-[0_0_auto]";

/** Square album cards (songs). */
export const HOME_RAIL_SQUARE =
  "w-[44vw] max-w-[11.5rem] flex-[0_0_min(44vw,11.5rem)] sm:w-[11rem] sm:flex-[0_0_11rem] md:w-full md:max-w-none md:flex-[0_0_auto]";

/** Vertical 9:16 short video previews. */
export const HOME_RAIL_PORTRAIT =
  "w-[38vw] max-w-[10.75rem] flex-[0_0_min(38vw,10.75rem)] sm:w-[10.75rem] sm:flex-[0_0_10.75rem] md:w-full md:max-w-none md:flex-[0_0_auto]";

export function HomeCollectionRail({
  children,
  className,
}: HomeCollectionRailProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-3 overflow-x-auto scroll-smooth px-1 pb-0.5",
        "snap-x snap-mandatory scroll-ps-1",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function homeRailItemClass(widthClass = HOME_RAIL_LANDSCAPE) {
  return cn("flex shrink-0 snap-start", widthClass);
}
