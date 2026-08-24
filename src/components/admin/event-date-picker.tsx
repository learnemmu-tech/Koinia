"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatEventDateLabel,
  formatEventDateString,
  parseEventDateString,
  startOfToday,
} from "@/lib/event-form-validation";
import { cn } from "@/lib/utils";

type EventDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
};

export function EventDatePicker({
  value,
  onChange,
  disabled = false,
  id,
  "aria-invalid": ariaInvalid,
}: EventDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseEventDateString(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-10 w-full justify-start rounded-md border border-input bg-transparent px-3 text-left font-normal shadow-sm hover:bg-accent/40",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
          {value ? formatEventDateLabel(value) : "Select event date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-auto w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatEventDateString(date));
            setOpen(false);
          }}
          disabled={{ before: startOfToday() }}
        />
      </PopoverContent>
    </Popover>
  );
}
