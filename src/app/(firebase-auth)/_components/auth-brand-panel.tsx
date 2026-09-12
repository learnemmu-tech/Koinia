import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  Gift,
  Heart,
  Music2,
  Play,
} from "lucide-react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { cn } from "@/lib/utils";

const MINISTRY_PILLS = [
  { icon: Music2, label: "Worship Songs" },
  { icon: BookOpen, label: "Sermons" },
  { icon: Heart, label: "Prayer Requests" },
  { icon: CalendarDays, label: "Events" },
  { icon: Gift, label: "Giving" },
  { icon: Play, label: "Shorts" },
] as const;

const chipClass = cn(
  "inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.88)] px-2.5 text-[12px] font-medium leading-none text-[#1C2B3A] shadow-none",
  "transition-[background-color,border-color] duration-150 ease-out",
  "hover:border-[#C0623A] hover:bg-white hover:text-[#1C2B3A]"
);

const localeClass = cn(
  "h-8 border-white/75 bg-white/95 px-2.5 text-[#1C2B3A] shadow-none",
  "hover:bg-white hover:text-[#1C2B3A]",
  "focus-visible:bg-white focus-visible:text-[#1C2B3A]",
  "data-[state=open]:bg-white data-[state=open]:text-[#1C2B3A]",
  "dark:border-white/75 dark:bg-white/95 dark:text-[#1C2B3A]",
  "dark:hover:bg-white dark:hover:text-[#1C2B3A]",
  "dark:focus-visible:bg-white dark:focus-visible:text-[#1C2B3A]",
  "dark:data-[state=open]:bg-white dark:data-[state=open]:text-[#1C2B3A]"
);

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden min-h-0 overflow-hidden lg:block lg:h-full lg:min-h-0">
      <Image
        src="/images/auth-hero.png"
        alt=""
        fill
        priority
        quality={95}
        sizes="50vw"
        className="object-cover object-[32%_38%]"
      />

      {/* Subtle left readability wash only — photograph stays sharp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[#F6F1E7]/28 via-[#F6F1E7]/08 to-transparent"
      />

      <div className="relative z-[1] flex h-full flex-col px-10 py-8 xl:px-12 xl:py-9">
        <div className="flex shrink-0 justify-end">
          <LocaleSwitcher className={localeClass} />
        </div>

        <div className="mt-[8vh] flex max-w-[32rem] flex-col xl:mt-[9vh]">
          <h2
            className="font-heading text-[1.75rem] font-semibold leading-[1.18] tracking-[-0.02em] text-[#1C2B3A] xl:text-[2.05rem]"
            style={{ textShadow: "0 1px 12px rgba(246,241,231,0.55)" }}
          >
            Where your church gathers,
            <br />
            worships, and grows.
          </h2>

          <p
            className="mt-3.5 max-w-[30rem] text-[0.9rem] leading-[1.5] text-[#2F3B4A] xl:text-[0.95rem]"
            style={{ textShadow: "0 1px 10px rgba(246,241,231,0.45)" }}
          >
            One organized home for worship, teaching, prayer, events, and giving
            — built for congregations in India and around the world.
          </p>

          <div className="mt-4 flex max-w-[32rem] flex-wrap content-start gap-x-2 gap-y-2">
            {MINISTRY_PILLS.map(({ icon: Icon, label }) => (
              <span key={label} className={chipClass}>
                <Icon
                  className="size-[14px] shrink-0 text-[#C0623A]"
                  strokeWidth={1.85}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex justify-end pb-0.5">
          <div className="flex flex-col items-end gap-2">
            <div
              aria-hidden
              className="h-px w-12 bg-[rgba(255,255,255,0.45)]"
            />
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.92)]"
              style={{ textShadow: "0 1px 10px rgba(28,43,58,0.4)" }}
            >
              A stronger church together
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
