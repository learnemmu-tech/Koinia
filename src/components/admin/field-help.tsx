"use client";

import { CircleHelp } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function FieldHelp({
  label,
  htmlFor,
  help,
}: {
  label: string;
  htmlFor?: string;
  help: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`About ${label}`}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-w-xs text-left text-sm leading-relaxed"
        >
          {help}
        </PopoverContent>
      </Popover>
    </div>
  );
}
