import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Users, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { heritageCommunityCta } from "@/templates/heritage/lib";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";

type CommunityCard = {
  href: string;
  title: string;
  description: string;
  cta: string;
  icon: LucideIcon;
};

function FeatureCard({ href, title, description, cta, icon: Icon }: CommunityCard) {
  return (
    <Link href={href} className="heritage-community-card">
      <span className="heritage-community-card-icon" aria-hidden>
        <Icon />
      </span>
      <div className="heritage-community-card-body">
        <h3 className="heritage-community-card-title">{title}</h3>
        <p className="heritage-community-card-copy">{description}</p>
        <span className="heritage-community-card-link">
          {cta}
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Prayer Requests, Community Chat, Shepherd AI, and groups from the home page. */
export function HeritageCommunitySection({ model }: { model: ChurchWebsiteViewModel }) {
  const prayer = heritageCommunityCta(model, "prayer");
  const chat = heritageCommunityCta(model, "chat");
  const shepherd = heritageCommunityCta(model, "shepherd");
  const showPrayer = model.church.showPrayerWall !== false;
  const showGroups = isSectionVisible(model.website.visibility, "ministries");

  const cards: CommunityCard[] = [
    ...(showPrayer
      ? [
          {
            href: prayer.href,
            title: "Prayer Requests",
            description: "Share a prayer request and let our community pray with you.",
            cta: "Submit a Request",
            icon: Heart,
          },
        ]
      : []),
    {
      href: chat.href,
      title: "Community Chat",
      description: "Connect with members, join discussions, and build meaningful relationships.",
      cta: "Open Chat",
      icon: Users,
    },
    {
      href: shepherd.href,
      title: "Meet Shepherd AI",
      description: "Your companion for Scripture, faith questions, and spiritual guidance.",
      cta: "Chat with Shepherd AI",
      icon: BookOpen,
    },
    ...(showGroups
      ? [
          {
            href: churchWebsitePath(model.church.slug, "/ministries"),
            title: "Find a Group",
            description: "Join a small group, serve together, and grow in faith.",
            cta: "Explore Groups",
            icon: UsersRound,
          },
        ]
      : []),
  ];

  return (
    <section
      aria-labelledby="heritage-community-heading"
      className="heritage-community-band"
    >
      <HeritageFrame className="heritage-community-inner">
        <header className="heritage-community-header">
          <p className="heritage-eyebrow heritage-kicker-with-rule">Community</p>
          <h2
            id="heritage-community-heading"
            className="heritage-display heritage-community-title"
          >
            We&apos;re Stronger When
            <span className="heritage-community-accent">We Pray Together.</span>
          </h2>
          <p className="heritage-community-lede">
            {showPrayer
              ? "Share your prayer requests, connect with church members, and get spiritual guidance through meaningful conversations and Shepherd AI."
              : "Connect with church members and get spiritual guidance through meaningful conversations and Shepherd AI."}
          </p>
        </header>
        <ul className="heritage-community-cards">
          {cards.map((card) => (
            <li key={card.title}>
              <FeatureCard {...card} />
            </li>
          ))}
        </ul>
      </HeritageFrame>
    </section>
  );
}
