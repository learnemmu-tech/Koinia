import { Skeleton } from "@/components/ui/skeleton";
import { songsPageGridClassName } from "@/components/music/firebase-song-card";

export default function SongsLoading() {
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
      <div className={songsPageGridClassName}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg p-2.5">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
