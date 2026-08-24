import { Skeleton } from "@/components/ui/skeleton";
import { contentCardGridClassName } from "@/lib/responsive-classes";

export function WorshipGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={contentCardGridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
