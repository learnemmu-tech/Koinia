import type { ComponentProps } from "react";

import { ContentAreaLoading } from "@/components/content-area-loading";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = ComponentProps<"div"> & {
  size?: "sm" | "md" | "lg";
};

/** @deprecated Prefer ContentAreaLoading — kept for call-site compatibility. */
export default function LoadingSpinner(props: LoadingSpinnerProps) {
  const { className, size: _size, ...rest } = props;

  return (
    <div className={cn("size-full", className)} {...rest}>
      <ContentAreaLoading />
    </div>
  );
}
