import { Skeleton } from "@/components/ui/skeleton";

import { HomeCollectionSkeleton } from "./home-collection-skeleton";

function SectionHeaderSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-3.5 w-56 max-w-full" />
    </div>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <SectionHeaderSkeleton />
        <HomeCollectionSkeleton count={6} />
      </div>
      <div className="space-y-3">
        <SectionHeaderSkeleton />
        <HomeCollectionSkeleton count={4} variant="wide" />
      </div>
    </div>
  );
}
