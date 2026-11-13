"use client";

import { useEffect, useState } from "react";

function parts(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalMinutes = Math.floor(diff / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

export function ParishCountdown({ isoDate, time }: { isoDate: string; time?: string }) {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const clock = time?.match(/(\d{1,2}):(\d{2})/);
  const target = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        clock ? Number(clock[1]) : 10,
        clock ? Number(clock[2]) : 0
      )
    : null;
  const [value, setValue] = useState(target ? parts(target) : null);

  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setValue(parts(target)), 30000);
    return () => window.clearInterval(timer);
  }, [isoDate, time]);

  if (!value) return null;

  const cells = [
    ["Days", value.days],
    ["Hours", value.hours],
    ["Minutes", value.minutes],
  ] as const;

  return (
    <div className="parish-countdown" aria-label="Time until the next service">
      {cells.map(([label, amount]) => (
        <div key={label}>
          <strong>{String(amount).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
