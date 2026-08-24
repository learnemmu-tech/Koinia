import { Skeleton } from "@/components/ui/skeleton";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type PageContentSkeletonProps = {
  variant?: "grid" | "detail" | "list";
};

export function PageContentSkeleton({
  variant = "grid",
}: PageContentSkeletonProps) {
  if (variant === "detail") {
    return (
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-10 pt-2">
        <Skeleton className="h-4 w-28" />
        <div className="overflow-hidden rounded-2xl border border-border/50">
          <Skeleton className="aspect-[21/9] w-full rounded-none" />
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-10 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48 sm:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-10 pt-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-40 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-full max-w-xs rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className={contentCardGridClassName}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
