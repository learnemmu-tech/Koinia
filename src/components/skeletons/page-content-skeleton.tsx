import { ContentAreaLoading } from "@/components/content-area-loading";

type PageContentSkeletonProps = {
  variant?: "grid" | "detail" | "list";
};

/** @deprecated Prefer ContentAreaLoading — kept for call-site compatibility. */
export function PageContentSkeleton(_props: PageContentSkeletonProps) {
  return <ContentAreaLoading />;
}
