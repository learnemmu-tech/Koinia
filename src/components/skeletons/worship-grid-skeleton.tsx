import { ContentAreaLoading } from "@/components/content-area-loading";

/** @deprecated Prefer ContentAreaLoading — kept for call-site compatibility. */
export function WorshipGridSkeleton(_props?: { count?: number }) {
  return <ContentAreaLoading />;
}
