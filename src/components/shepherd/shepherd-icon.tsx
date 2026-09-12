import { forwardRef, type SVGProps } from "react";

import { cn } from "@/lib/utils";

/** Approved Shepherd AI badge (shepherd + sheep silhouette). */
export const SHEPHERD_ICON_SRC = "/icons/shepherd-ai.webp";

type ShepherdIconProps = SVGProps<SVGSVGElement> & {
  /** Omit when a parent control already provides an accessible name. */
  title?: string;
};

/**
 * Approved Shepherd AI identity mark.
 * Premium cream badge with shepherd + staff + sheep silhouette
 * (not a generic pictogram).
 */
export const ShepherdIcon = forwardRef<SVGSVGElement, ShepherdIconProps>(
  function ShepherdIcon({ className, title, ...props }, ref) {
    const labeled = Boolean(title);

    return (
      <svg
        ref={ref}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("size-5 shrink-0 overflow-hidden rounded-full", className)}
        aria-hidden={labeled ? undefined : true}
        role={labeled ? "img" : undefined}
        {...props}
      >
        {labeled ? <title>{title}</title> : null}
        <image
          href={SHEPHERD_ICON_SRC}
          width={64}
          height={64}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    );
  }
);

/** @deprecated Prefer ShepherdIcon — kept for existing Shepherd UI imports. */
export const ShepherdMark = ShepherdIcon;
