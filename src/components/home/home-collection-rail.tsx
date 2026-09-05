import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HomeCollectionRailProps = {
  children: ReactNode;
  className?: string;
};

export function HomeCollectionRail({
  children,
  className,
}: HomeCollectionRailProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] snap-x snap-mandatory [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function homeRailItemClass(widthClass = "w-[15.75rem]") {
  return cn("shrink-0 snap-start", widthClass);
}
