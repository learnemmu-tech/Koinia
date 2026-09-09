import { pageDetailClass } from "@/lib/responsive-classes";

export default function BookDetailLoading() {
  return (
    <div className={`${pageDetailClass} space-y-6 pt-2`}>
      <div className="h-8 w-28 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
        <div className="mx-auto aspect-[2/3] w-full max-w-[180px] animate-pulse rounded-[10px] bg-muted md:mx-0" />
        <div className="space-y-3 pt-1">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
