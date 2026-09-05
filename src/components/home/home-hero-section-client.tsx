"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Heart,
  HeartHandshake,
  Music2,
  Play,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { FirebaseChurch } from "@/types/firebase-church";
import type { WorshipVerse } from "@/lib/worship-verses";

import { cn } from "@/lib/utils";

const HOLD_MS = 6500;
const FADE_MS = 900;

const SLIDES = [
  {
    emoji: "📖",
    badge: "Sermons",
    heading: "Listen to Sermons That Strengthen Faith",
    description:
      "Be encouraged by messages that teach Scripture and help you walk more closely with Christ.",
    primary: { href: "/sermons", label: "Explore Sermons" },
    secondary: { href: "/songs", label: "Explore Songs" },
  },
  {
    emoji: "🎵",
    badge: "Worship",
    heading: "Worship Together Through Song",
    description:
      "Discover worship songs with full lyrics in Telugu, English, and more. Sing together as one body.",
    primary: { href: "/songs", label: "Explore Songs" },
    secondary: { href: "/sermons", label: "Explore Sermons" },
  },
  {
    emoji: "🙏",
    badge: "Prayer",
    heading: "Pray for One Another",
    description:
      "Submit prayer requests and stand with your church community in faith and intercession.",
    primary: { href: "/prayer-requests", label: "Prayer Requests" },
    secondary: { href: "/prayer-requests/submit", label: "Share a request" },
  },
  {
    emoji: "🤝",
    badge: "Community",
    heading: "Stay Connected as a Church",
    description:
      "Your entire church community, events, and updates in one organized digital home.",
    primary: { href: "/events", label: "View Events" },
    secondary: { href: "/articles", label: "Read Articles" },
  },
  {
    emoji: "❤️",
    badge: "Giving",
    heading: "Give and Support Your Ministry",
    description:
      "Support your church's mission through organized giving campaigns and transparent donation tracking.",
    primary: { href: "/donations", label: "Support Ministry" },
    secondary: { href: "/about", label: "Learn more" },
  },
] as const;

type FeatureKey =
  | "songs"
  | "sermons"
  | "prayer"
  | "events"
  | "donations"
  | "shorts"
  | "articles"
  | "community";

type FeatureItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  iconClass: string;
  iconWrapClass: string;
};

const FEATURES: Record<FeatureKey, FeatureItem> = {
  songs: {
    href: "/songs",
    icon: Music2,
    label: "Worship Songs",
    desc: "Listen and worship together",
    iconClass: "text-violet-400",
    iconWrapClass: "bg-violet-400/10",
  },
  sermons: {
    href: "/sermons",
    icon: BookOpen,
    label: "Sermons",
    desc: "Messages that strengthen faith",
    iconClass: "text-blue-400",
    iconWrapClass: "bg-blue-400/10",
  },
  prayer: {
    href: "/prayer-requests",
    icon: Heart,
    label: "Prayer Wall",
    desc: "Pray with the community",
    iconClass: "text-rose-400",
    iconWrapClass: "bg-rose-400/10",
  },
  events: {
    href: "/events",
    icon: CalendarDays,
    label: "Ministry Events",
    desc: "Gather, worship, and connect",
    iconClass: "text-amber-400",
    iconWrapClass: "bg-amber-400/10",
  },
  donations: {
    href: "/donations",
    icon: HeartHandshake,
    label: "Donations",
    desc: "Support your ministry",
    iconClass: "text-emerald-400",
    iconWrapClass: "bg-emerald-400/10",
  },
  shorts: {
    href: "/sermons",
    icon: Play,
    label: "Video Shorts",
    desc: "Short messages and inspiration",
    iconClass: "text-red-400",
    iconWrapClass: "bg-red-400/10",
  },
  articles: {
    href: "/articles",
    icon: FileText,
    label: "Articles",
    desc: "Faith, teaching, and stories",
    iconClass: "text-cyan-400",
    iconWrapClass: "bg-cyan-400/10",
  },
  community: {
    href: "/events",
    icon: Users,
    label: "Community",
    desc: "Stay connected together",
    iconClass: "text-indigo-400",
    iconWrapClass: "bg-indigo-400/10",
  },
};

const FEATURE_SETS: readonly FeatureKey[][] = [
  ["songs", "sermons", "prayer", "events"],
  ["donations", "shorts", "articles", "community"],
  ["songs", "articles", "sermons", "prayer"],
  ["events", "donations", "shorts", "sermons"],
  ["articles", "songs", "community", "prayer"],
];

const contentTransition = {
  transitionProperty: "opacity, transform",
  transitionDuration: `${FADE_MS}ms`,
  transitionTimingFunction: "ease-in-out",
} as const;

type HomeHeroSectionClientProps = {
  church?: FirebaseChurch | null;
  verse: WorshipVerse;
};

export function HomeHeroSectionClient({ verse }: HomeHeroSectionClientProps) {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const [cycleKey, setCycleKey] = React.useState(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const fadeRef = React.useRef<number | null>(null);
  const slideRef = React.useRef(0);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const showSlide = React.useCallback((index: number) => {
    const nextIndex = (index + SLIDES.length) % SLIDES.length;
    if (reduceMotion) {
      slideRef.current = nextIndex;
      setSlideIndex(nextIndex);
      setVisible(true);
      return;
    }

    setVisible(false);
    if (fadeRef.current) window.clearTimeout(fadeRef.current);
    fadeRef.current = window.setTimeout(() => {
      slideRef.current = nextIndex;
      setSlideIndex(nextIndex);
      setVisible(true);
    }, FADE_MS);
  }, [reduceMotion]);

  React.useEffect(() => {
    if (reduceMotion) return;

    const interval = window.setInterval(() => {
      showSlide(slideRef.current + 1);
    }, HOLD_MS);

    return () => {
      window.clearInterval(interval);
      if (fadeRef.current) window.clearTimeout(fadeRef.current);
    };
  }, [cycleKey, reduceMotion, showSlide]);

  function goTo(index: number) {
    if (index === slideIndex) return;
    showSlide(index);
    setCycleKey((key) => key + 1);
  }

  const slide = SLIDES[slideIndex]!;
  const features = FEATURE_SETS[slideIndex]!.map((key) => FEATURES[key]);

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden rounded-[16px] border border-border bg-card"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, hsl(var(--foreground) / 0.04) 0%, transparent 60%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-5 sm:px-6 md:px-7 md:py-5">
          <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground md:text-[11px]">
            Faith Connect Hub
          </p>

          <div
            aria-live="polite"
            className={cn(
              "mt-2.5 motion-reduce:transition-none",
              visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            )}
            style={contentTransition}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="text-[13px] leading-none grayscale-[0.15]" aria-hidden>
                {slide.emoji}
              </span>
              {slide.badge}
            </span>

            <h1
              id="home-hero-heading"
              className="mt-3 min-h-[3.9rem] max-w-[460px] text-[26px] font-bold leading-[1.18] text-foreground md:min-h-[4.8rem] md:text-[33px]"
            >
              {slide.heading}
            </h1>

            <p className="mt-2.5 min-h-[3.3rem] max-w-[420px] text-[14px] leading-[1.7] text-muted-foreground md:text-[15px]">
              {slide.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={slide.primary.href}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {slide.primary.label}
              </Link>
              <Link
                href={slide.secondary.href}
                className="inline-flex h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {slide.secondary.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div
            className="mt-3.5 flex items-center gap-1"
            role="tablist"
            aria-label="Hero slides"
          >
            {SLIDES.map((item, index) => (
              <button
                key={item.heading}
                type="button"
                role="tab"
                aria-label={item.heading}
                aria-selected={index === slideIndex}
                onClick={() => goTo(index)}
                className={cn(
                  "h-[3px] rounded-[2px] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  index === slideIndex
                    ? "w-6 bg-foreground"
                    : "w-2 bg-muted hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2.5 border-t border-border px-5 py-5 sm:px-6 md:border-l md:border-t-0 md:px-7 md:py-5">
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((feature, slot) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={slot}
                  href={feature.href}
                  className="app-interactive flex h-[98px] flex-col justify-center rounded-[10px] border border-border bg-card p-3.5"
                >
                  <div
                    className={cn(
                      "motion-reduce:transition-none",
                      visible ? "translate-y-0 opacity-100" : "translate-y-[3px] opacity-0"
                    )}
                    style={contentTransition}
                  >
                    <div
                      className={cn(
                        "mb-2.5 flex size-8 items-center justify-center rounded-lg",
                        feature.iconWrapClass
                      )}
                    >
                      <Icon className={cn("size-4", feature.iconClass)} aria-hidden />
                    </div>
                    <p className="text-[13px] font-semibold leading-none text-foreground">
                      {feature.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="min-h-[76px] rounded-[10px] border border-border bg-card px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Verse of the day
              </p>
              <span className="rounded bg-accent px-2 py-0.5 text-[11px] text-foreground">
                {verse.reference}
              </span>
            </div>
            <blockquote className="mt-1 line-clamp-2 text-[13px] italic leading-[1.55] text-muted-foreground">
              &ldquo;{verse.text}&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
