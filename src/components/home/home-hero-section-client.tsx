"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Music2, Heart, Users, HandHeart } from "lucide-react";

import type { FirebaseChurch } from "@/types/firebase-church";
import type { WorshipVerse } from "@/lib/worship-verses";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const ROTATION_MS = 10000;

const SLIDES = [
  {
    icon: "🎵",
    eyebrow: "Worship Through Song",
    heading: "Discover Worship Songs & Lyrics",
    description:
      "Explore Christian worship songs in Telugu and English. Find lyrics, listen to audio, and deepen your worship experience.",
  },
  {
    icon: "📖",
    eyebrow: "Grow Through God's Word",
    heading: "Read Sermons & Articles",
    description:
      "Strengthen your faith with sermons and articles from trusted ministers and worship leaders.",
  },
  {
    icon: "🙏",
    eyebrow: "Pray Together",
    heading: "Share Prayer Requests",
    description:
      "Bring your burdens to the community. Share prayer requests and stand in prayer for one another.",
  },
  {
    icon: "✝️",
    eyebrow: "Join The Community",
    heading: "Ministry Events & Gatherings",
    description:
      "Stay connected with worship gatherings, ceremonies, and ministry events happening near you.",
  },
  {
    icon: "💛",
    eyebrow: "Support The Mission",
    heading: "Give & Support Ministry",
    description:
      "Help spread the Gospel by supporting ministry initiatives and outreach campaigns through giving.",
  },
] as const;

const FEATURE_CARDS = [
  { icon: Music2,   label: "Worship Songs",    desc: "Telugu & English" },
  { icon: BookOpen, label: "Sermons",           desc: "Faith Resources"  },
  { icon: Heart,    label: "Prayer Wall",       desc: "Community Prayer" },
  { icon: Users,    label: "Ministry Events",   desc: "Join & Connect"   },
] as const;

type HomeHeroSectionClientProps = {
  church?: FirebaseChurch | null;
  verse: WorshipVerse;
};

export function HomeHeroSectionClient({
  church,
  verse,
}: HomeHeroSectionClientProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  const ministryMessage =
    church?.welcomeMessage?.trim() ||
    "A complete Christian worship and ministry platform.";

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % SLIDES.length);
        setVisible(true);
      }, 300);
    }, ROTATION_MS);
    return () => window.clearInterval(interval);
  }, []);

  function goTo(index: number) {
    if (index === activeIndex) return;
    setVisible(false);
    window.setTimeout(() => {
      setActiveIndex(index);
      setVisible(true);
    }, 300);
  }

  const slide = SLIDES[activeIndex]!;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
      {/* Subtle background gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-0 md:grid-cols-2">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col justify-between p-5 sm:p-7 md:p-8 lg:p-10"
          style={{ minHeight: "320px" }}>

          {/* Top: platform name + dots */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/60">
                {siteConfig.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{ministryMessage}</p>
            </div>
            {/* Dots — mobile only */}
            <div className="flex items-center gap-1.5 md:hidden" role="tablist">
              {SLIDES.map((s, i) => (
                <button
                  key={s.eyebrow}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  onClick={() => goTo(i)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === activeIndex ? "h-1.5 w-5 bg-primary" : "h-1.5 w-1.5 bg-primary/25 hover:bg-primary/50"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Rotating slide */}
          <div
            aria-live="polite"
            className={cn(
              "my-5 space-y-2.5 transition-opacity duration-300",
              visible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">{slide.icon}</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                {slide.eyebrow}
              </p>
            </div>
            <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
              {slide.heading}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {slide.description}
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="h-9 rounded-full px-5 font-semibold">
              <Link href="#songs">
                Explore Songs
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost"
              className="h-9 rounded-full px-5 text-muted-foreground hover:text-foreground">
              <Link href="/about">
                <BookOpen className="mr-1.5 size-3.5" />
                Learn More
              </Link>
            </Button>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden flex-col gap-4 border-l border-border/30 p-5 sm:p-7 md:flex md:p-8 lg:p-10">

          {/* Dots desktop */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex ? "h-1.5 w-5 bg-primary" : "h-1.5 w-1.5 bg-primary/25 hover:bg-primary/50"
                )}
              />
            ))}
          </div>

          {/* Feature mini cards */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {FEATURE_CARDS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background/50 p-3.5 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Verse of the day */}
          <div className="relative rounded-xl border border-border/40 bg-background/60 px-4 py-3 backdrop-blur-sm">
            <div aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-[0.05]">
              <svg width="48" height="48" viewBox="0 0 80 80" fill="currentColor" className="text-primary">
                <rect x="34" y="0" width="12" height="80" rx="4" />
                <rect x="0" y="28" width="80" height="12" rx="4" />
              </svg>
            </div>
            <div className="relative space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-primary/50">
                  Verse of the Day
                </p>
                <span className="rounded-full bg-primary/10 px-1.5 py-0 text-[9px] font-bold text-primary">
                  {verse.reference}
                </span>
              </div>
              <blockquote className="line-clamp-2 font-script text-xs italic leading-snug text-foreground/80 sm:text-sm">
                &ldquo;{verse.text}&rdquo;
              </blockquote>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}