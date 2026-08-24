import { Calendar } from "lucide-react";

import { formatContentDate } from "@/lib/content-date";
import { cn } from "@/lib/utils";

type ContentCreatedDateProps = {
  timestamp: number;
  className?: string;
};

export function ContentCreatedDate({
  timestamp,
  className,
}: ContentCreatedDateProps) {
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        className
      )}
    >
      <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
      {formatContentDate(timestamp)}
    </time>
  );
}
