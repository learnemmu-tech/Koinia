import Link from "next/link";
import { ArrowRight } from "lucide-react";

type HomeSectionHeaderProps = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  viewAllLabel?: string;
};

export function HomeSectionHeader({
  id,
  title,
  description,
  href,
  viewAllLabel = "View all",
}: HomeSectionHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <h2
          id={id}
          className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {title}
        </h2>
        {href ?
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          >
            {viewAllLabel}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        : null}
      </div>
      {description ?
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      : null}
    </div>
  );
}
