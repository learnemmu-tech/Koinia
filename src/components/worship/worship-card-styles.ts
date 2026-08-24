import { contentCardGridClassName } from "@/lib/responsive-classes";

/** Shared layout styles for Articles & Sermons vertical content cards only. */

export const worshipContentCardClassName =
  "group flex h-[340px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 transition-all duration-200 hover:-translate-y-1 hover:border-border/80 hover:bg-card/60 hover:shadow-lg hover:shadow-black/20";

export const worshipContentImageClassName =
  "relative h-[180px] w-full shrink-0 overflow-hidden";

export const worshipContentGridClassName = contentCardGridClassName;
