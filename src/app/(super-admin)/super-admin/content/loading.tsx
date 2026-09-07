import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminPlatformContentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-9 w-full max-w-2xl rounded-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
