import { cn } from "@/lib/utils";

/** Outer shell — used in (root) layout main content wrapper */
export const pageShellClass =
  "mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 md:px-6 md:py-6 lg:gap-6";

/** Standard list/hub pages (songs, sermons, events, etc.) */
export const pageContentClass =
  "mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-10 pt-2 sm:space-y-8";

/** Detail pages (song, event, sermon) */
export const pageDetailClass = "mx-auto w-full min-w-0 max-w-4xl pb-10";

/** Long-form reading */
export const pageProseClass = "mx-auto w-full min-w-0 max-w-[min(100%,47rem)]";

/** Legal / narrow forms */
export const pageNarrowClass = "mx-auto w-full min-w-0 max-w-3xl";

/** Admin section spacing — layout already provides horizontal padding */
export const adminSectionClass = "space-y-4 py-4 sm:space-y-6 sm:py-6";

/** Filter selects in toolbars — full width on mobile */
export const responsiveFilterSelectClass =
  "h-11 w-full min-w-0 sm:h-9 sm:w-[8.75rem]";

export const responsiveFilterSelectWideClass =
  "h-11 w-full min-w-0 sm:h-9 sm:w-[10rem]";

/** Admin modal / dialog content — mobile-safe */
export const responsiveDialogContentClass =
  "max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:w-full sm:max-w-lg sm:p-6";

export const responsiveDialogContentLgClass = cn(
  responsiveDialogContentClass,
  "sm:max-w-2xl"
);

/** Fluid hero title (marketing / about) */
export const typeHeroTitleClass =
  "font-heading text-[clamp(1.75rem,1.15rem+2.2vw,3.75rem)] font-bold leading-tight tracking-tight";

/** Fluid page title */
export const typePageTitleClass =
  "font-heading text-[clamp(1.375rem,1.15rem+0.9vw,1.875rem)] font-bold leading-tight tracking-tight";

/** Fluid section title */
export const typeSectionTitleClass =
  "font-heading text-[clamp(1.125rem,1rem+0.5vw,1.5rem)] font-semibold leading-snug";

/**
 * Responsive grid for content cards (songs, sermons, articles, events, donations).
 * Mobile: 1 col · Tablet (sm): 2 cols · Desktop (lg): 3 cols · Wide (xl): 4 cols
 */
export const contentCardGridClassName =
  "grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
