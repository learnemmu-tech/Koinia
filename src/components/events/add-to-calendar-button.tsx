"use client";

import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseEvent } from "@/types/firebase-event";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildGoogleCalendarUrl,
  downloadIcsFile,
} from "@/lib/event-calendar";

type AddToCalendarButtonProps = {
  event: FirebaseEvent;
};

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  function handleGoogleCalendar() {
    window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer");
  }

  function handleDownloadIcs() {
    try {
      downloadIcsFile(event);
      toast.success("Calendar file downloaded");
    } catch {
      toast.error("Unable to create calendar file");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full px-4 text-sm"
        >
          <CalendarPlus className="size-3.5" />
          Add To Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadIcs}>
          Download .ics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
