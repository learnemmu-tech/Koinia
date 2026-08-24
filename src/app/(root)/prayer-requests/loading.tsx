import { PrayerWallCardSkeleton } from "@/components/prayer/prayer-wall-card";

import { pageContentClass } from "@/lib/responsive-classes";



export default function PrayerRequestsLoading() {

  return (

    <section className={pageContentClass} aria-busy="true" aria-label="Loading">

      <div className="space-y-8">

        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex min-w-0 items-start gap-4">

            <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-muted sm:size-16" />

            <div className="min-w-0 space-y-2">

              <div className="h-8 w-40 animate-pulse rounded-lg bg-muted sm:h-9 sm:w-48" />

              <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded bg-muted" />

            </div>

          </div>

          <div className="h-10 w-36 animate-pulse rounded-full bg-muted" />

        </header>



        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {Array.from({ length: 6 }).map((_, index) => (

            <PrayerWallCardSkeleton key={index} />

          ))}

        </div>

      </div>

    </section>

  );

}

