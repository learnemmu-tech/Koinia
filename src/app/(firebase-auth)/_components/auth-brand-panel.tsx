import {
  BookOpen,
  CalendarDays,
  Heart,
  HeartHandshake,
  Music2,
  Play,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const MINISTRY_PILLS = [
  { icon: Music2, label: "Worship Songs" },
  { icon: BookOpen, label: "Sermons" },
  { icon: Heart, label: "Prayer Requests" },
  { icon: CalendarDays, label: "Events" },
  { icon: HeartHandshake, label: "Giving" },
  { icon: Play, label: "Shorts" },
] as const;

function DecorativeCross({
  size,
  opacity,
  className,
}: {
  size: number;
  opacity: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{ width: size, height: size, opacity }}
    >
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <div className="relative hidden min-h-svh overflow-hidden border-l border-border bg-[hsl(var(--background))] lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/[0.035] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 size-[320px] rounded-full bg-white/[0.025] blur-[70px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <DecorativeCross size={24} opacity={0.1} className="right-8 top-8" />
      <DecorativeCross size={18} opacity={0.07} className="bottom-12 left-12" />

      <div className="relative z-[1] flex min-h-svh items-center justify-center px-8 py-12 lg:px-12 lg:py-16">
        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center text-center">
          <span className="mb-7 rounded-full border border-white/[0.1] bg-white/[0.05] px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {siteConfig.name}
          </span>

          <h2 className="font-heading mb-5 max-w-[360px] text-[2rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-foreground lg:text-[2.65rem]">
            Where your church gathers, worships, and grows.
          </h2>

          <p className="mb-10 max-w-[340px] text-sm leading-relaxed text-muted-foreground">
            One organized home for worship, teaching, prayer, events, and
            giving — built for congregations in India and around the world.
          </p>

          <div className="flex w-full flex-wrap justify-center gap-2">
            {MINISTRY_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-foreground/75 backdrop-blur-sm"
              >
                <Icon
                  className="size-3.5 shrink-0 text-foreground/60"
                  strokeWidth={1.75}
                />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-12 w-full max-w-[360px] border-t border-white/[0.06] pt-8">
            <p className="text-[11px] tracking-wide text-muted-foreground/50">
              Your church, connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
