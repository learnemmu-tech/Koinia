import { Skeleton } from "@/components/ui/skeleton";

type HomeCollectionSkeletonProps = {
  count?: number;
  variant?: "square" | "wide";
};

export function HomeCollectionSkeleton({
  count = 4,
  variant = "square",
}: HomeCollectionSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-[10.5rem] shrink-0 space-y-2.5 sm:w-44">
          <Skeleton
            className={
              variant === "wide" ? "aspect-video w-full rounded-lg" : "aspect-square w-full rounded-lg"
            }
          />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
