"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVENT_TIME_HOURS,
  EVENT_TIME_MINUTES,
  EVENT_TIME_PERIODS,
  formatEventTimeValue,
  parseEventTimeValue,
  type EventTimePeriod,
} from "@/lib/event-form-validation";
import { cn } from "@/lib/utils";

type EventTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
};

export function EventTimePicker({
  value,
  onChange,
  disabled = false,
  id,
  "aria-invalid": ariaInvalid,
}: EventTimePickerProps) {
  const parsed = useMemo(() => parseEventTimeValue(value), [value]);

  const minuteOptions = useMemo(() => {
    const options = new Set<string>(EVENT_TIME_MINUTES);
    if (parsed?.minute) options.add(parsed.minute);
    return Array.from(options).sort();
  }, [parsed?.minute]);

  const [hour, setHour] = useState(parsed?.hour ?? "");
  const [minute, setMinute] = useState(parsed?.minute ?? "");
  const [period, setPeriod] = useState<EventTimePeriod | "">(
    parsed?.period ?? ""
  );

  useEffect(() => {
    const next = parseEventTimeValue(value);
    if (next) {
      setHour(next.hour);
      setMinute(next.minute);
      setPeriod(next.period);
      return;
    }

    if (!value) {
      setHour("");
      setMinute("");
      setPeriod("");
    }
  }, [value]);

  function updateTime(
    nextHour: string,
    nextMinute: string,
    nextPeriod: EventTimePeriod | ""
  ) {
    setHour(nextHour);
    setMinute(nextMinute);
    setPeriod(nextPeriod);

    if (nextHour && nextMinute && nextPeriod) {
      onChange(formatEventTimeValue(nextHour, nextMinute, nextPeriod));
    }
  }

  const hasSelection = Boolean(hour && minute && period);

  return (
    <div
      id={id}
      aria-invalid={ariaInvalid}
      className={cn(
        "grid grid-cols-3 gap-2",
        !hasSelection && value === "" && "[&_button]:text-muted-foreground"
      )}
    >
      <Select
        disabled={disabled}
        value={hour || undefined}
        onValueChange={(nextHour) => updateTime(nextHour, minute, period)}
      >
        <SelectTrigger aria-label="Event hour">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TIME_HOURS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={minute || undefined}
        onValueChange={(nextMinute) => updateTime(hour, nextMinute, period)}
      >
        <SelectTrigger aria-label="Event minute">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={period || undefined}
        onValueChange={(nextPeriod) =>
          updateTime(hour, minute, nextPeriod as EventTimePeriod)
        }
      >
        <SelectTrigger aria-label="Event AM or PM">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TIME_PERIODS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
