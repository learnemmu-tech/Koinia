import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Globe,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  Mic2,
  Music,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { typeHeroTitleClass, typeSectionTitleClass } from "@/lib/responsive-classes";

export const metadata = buildPageMetadata({
  title: "About Us",
  description: `${siteConfig.name} is a modern Christian worship and ministry platform helping believers, churches, ministries, and worship teams connect through faith-based content and community engagement.`,
  path: "/about",
  keywords: [
    "Christian worship platform",
    "ministry platform",
    "church technology",
    "faith community",
    "worship ministry",
  ],
});

const CORE_FEATURES = [
  {
    icon: Music,
    title: "Worship Songs & Lyrics",
    description:
      "Discover, search, and engage with worship songs and lyrics that help believers draw near to God in personal and corporate worship.",
  },
  {
    icon: Mic2,
    title: "Sermons & Biblical Teachings",
    description:
      "Access sermons and biblical teachings that strengthen faith, encourage spiritual growth, and support discipleship.",
  },
  {
    icon: BookOpen,
    title: "Christian Articles & Resources",
    description:
      "Read faith-centered articles and ministry resources designed to inform, inspire, and equip the body of Christ.",
  },
  {
    icon: Sparkles,
    title: "Prayer Request Management",
    description:
      "Submit, track, and participate in prayer requests—building a community of intercession and mutual encouragement.",
  },
  {
    icon: CalendarDays,
    title: "Ministry Events",
    description:
      "Stay informed about upcoming ministry events, gatherings, and opportunities to worship and serve together.",
  },
  {
    icon: HeartHandshake,
    title: "Donation Campaigns",
    description:
      "Support ministry initiatives through transparent donation campaigns that help advance the work of the Gospel.",
  },
  {
    icon: LayoutDashboard,
    title: "User Profiles & Dashboard",
    description:
      "Manage your personal worship journey with profiles, activity dashboards, and a centralized view of your engagement.",
  },
  {
    icon: Heart,
    title: "Favorites & Recently Viewed",
    description:
      "Save meaningful content and quickly return to songs, sermons, and articles that have impacted your walk with Christ.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Receive timely updates about new content, prayer activity, events, and ministry announcements.",
  },
  {
    icon: Search,
    title: "Global Search",
    description:
      "Find songs, sermons, articles, and events across the platform with powerful, unified search.",
  },
  {
    icon: Shield,
    title: "Administrative Tools",
    description:
      "Empower ministry leaders with content management, moderation, analytics, and platform administration capabilities.",
  },
  {
    icon: Globe,
    title: "Community Engagement",
    description:
      "Connect believers, ministries, and worship teams in one trusted digital space built for faith and fellowship.",
  },
];

const TARGET_AUDIENCE = [
  "Churches seeking a centralized digital ministry presence",
  "Ministries sharing teaching, worship, and outreach resources",
  "Worship teams distributing songs, lyrics, and worship content",
  "Christian organizations coordinating events and community engagement",
  "Christian communities fostering prayer, fellowship, and growth",
  "Individual believers pursuing daily worship, learning, and prayer",
];

const FUTURE_GOALS = [
  "Expand multilingual worship and teaching resources for global reach",
  "Deepen community features that connect believers across ministries",
  "Enhance tools for churches to manage content, events, and engagement",
  "Strengthen prayer networks and intercession communities worldwide",
  "Build trusted partnerships with ministries committed to biblical faith",
  "Continue improving accessibility, security, and user experience for all believers",
];

export default function AboutPage() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <section
        className="relative flex flex-col items-center justify-center px-3 py-16 text-center sm:px-4 sm:py-20 md:py-28"
        aria-labelledby="about-hero-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-5">
          <ImageWithFallback
            src={siteConfig.image}
            fallback="/images/logo.png"
            alt={siteConfig.name}
            width={280}
            height={84}
            className="h-auto w-full max-w-[220px] object-contain sm:max-w-[280px]"
          />

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/70">
              Christian Worship & Ministry Platform
            </p>
            <h1 id="about-hero-heading" className={typeHeroTitleClass}>
              About {siteConfig.name}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {siteConfig.name} is a modern Christian worship and ministry platform
              that helps believers, churches, ministries, and worship teams connect
              through faith-based content and community engagement.
            </p>
          </div>

          <div className="mt-2 flex items-center gap-3 text-primary/40">
            <span className="block h-px w-12 bg-current" />
            <Target className="size-3.5 opacity-60" aria-hidden />
            <span className="block h-px w-12 bg-current" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-3 pb-16 sm:px-4 sm:pb-20">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Introduction
            </p>
            <h2 className={typeSectionTitleClass}>
              A Platform Built for Faith, Worship, and Community
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              {siteConfig.name} exists to serve the body of Christ through technology
              that honors God and supports ministry. We provide a centralized digital
              home where worship resources, biblical teaching, prayer, events, and
              community engagement come together in one accessible platform.
            </p>
            <p>
              Whether you are an individual believer seeking daily encouragement, a
              worship team sharing songs and lyrics, or a ministry organizing events
              and outreach, {siteConfig.name} is designed to help you grow in faith,
              participate in worship, and stay connected to the Christian community.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-3 py-14 sm:px-4 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Mission
            </p>
            <h2 className={`mt-2 ${typeSectionTitleClass}`}>Our Mission</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              To strengthen faith, encourage worship, support prayer, and build
              meaningful Christian communities through technology. We seek to equip
              believers and ministries with tools that make Gospel-centered content,
              fellowship, and service accessible to all.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Vision
            </p>
            <h2 className={`mt-2 ${typeSectionTitleClass}`}>Our Vision</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              To become a trusted digital platform where ministries and believers
              connect, learn, worship, pray, and grow together—united by faith in
              Jesus Christ and a shared commitment to biblical truth and Christian
              community.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary px-6 py-14 text-center sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5"
        >
          <svg width="320" height="320" viewBox="0 0 320 320" fill="white">
            <rect x="140" y="0" width="40" height="320" rx="6" />
            <rect x="0" y="110" width="320" height="40" rx="6" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Colossians 3:16
          </p>
          <blockquote className="font-heading text-xl font-medium leading-relaxed text-primary-foreground sm:text-2xl md:text-3xl">
            &ldquo;Let the word of Christ dwell in you richly, teaching and admonishing
            one another in all wisdom, singing psalms and hymns and spiritual songs,
            with thankfulness in your hearts to God.&rdquo;
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Platform Features
          </p>
          <h2 className={typeSectionTitleClass}>Core Features</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to worship, learn, pray, give, and stay connected—all
            in one ministry-focused platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-heading text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              <div className="absolute bottom-0 left-6 right-6 h-0.5 scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Who We Serve
            </p>
            <h2 className={typeSectionTitleClass}>
              Built for the Body of Christ
            </h2>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {TARGET_AUDIENCE.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground"
              >
                <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Community Impact
            </p>
            <h2 className={typeSectionTitleClass}>
              Strengthening Faith Across Communities
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              {siteConfig.name} enables ministries to share content, organize events,
              receive donations, manage prayer requests, and engage with believers
              worldwide. By bringing worship, teaching, prayer, and giving into one
              platform, we help churches and ministries extend their reach and deepen
              their impact.
            </p>
            <p>
              Believers benefit from easy access to Gospel-centered resources, a
              supportive prayer community, and tools that encourage consistent
              spiritual growth. Our platform is designed not merely as software, but
              as a ministry resource that serves the Church and glorifies God.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Our Purpose
            </p>
            <h2 className={typeSectionTitleClass}>
              Why {siteConfig.name} Exists
            </h2>
          </div>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Christians need more than scattered resources—they need a trusted place to
            worship, learn, pray, and connect. {siteConfig.name} was created to answer
            that need: a centralized digital platform where faith comes first, ministry
            is supported, and believers can grow together in Christ.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Looking Ahead
            </p>
            <h2 className={typeSectionTitleClass}>Future Goals</h2>
          </div>

          <ul className="space-y-3">
            {FUTURE_GOALS.map((goal) => (
              <li
                key={goal}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 text-center sm:pb-20">
        <div className="space-y-6 rounded-2xl border border-border/50 bg-muted/30 px-6 py-10 sm:px-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Get Started
            </p>
            <h2 className={typeSectionTitleClass}>
              Join the {siteConfig.name} Community
            </h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
              Explore worship content, submit prayer requests, discover events, and
              grow in faith with believers around the world.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?callbackUrl=%2Fonboarding"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Create Workspace
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Explore Platform
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sign In
            </Link>
            {siteConfig.author.email ?
              <Link
                href={`mailto:${siteConfig.author.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Contact Us
              </Link>
            : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Read our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
