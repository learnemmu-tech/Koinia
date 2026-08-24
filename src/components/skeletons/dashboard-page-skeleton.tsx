import { Skeleton } from "@/components/ui/skeleton";
import { adminSectionClass } from "@/lib/responsive-classes";

export function DashboardPageSkeleton() {
  return (
    <div className={adminSectionClass}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
