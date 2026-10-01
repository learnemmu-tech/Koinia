import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Users } from "lucide-react";
import type { ReactNode } from "react";

import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { heritageCommunityCta } from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

function FeatureCard({
  href,
  image,
  icon,
  title,
  description,
  cta,
  imageClass = "object-cover object-[center_42%]",
}: {
  href: string;
  image: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  imageClass?: string;
}) {
  return (
    <Link href={href} className="heritage-community-card">
      <div className="heritage-community-card-media">
        <HeritageImage
          src={image}
          alt=""
          fallback={image}
          className={imageClass}
          sizes="(max-width: 768px) 100vw, 22rem"
        />
      </div>
      <span className="heritage-community-card-icon" aria-hidden>
        {icon}
      </span>
      <div className="heritage-community-card-body">
        <h3 className="heritage-community-card-title">{title}</h3>
        <p className="heritage-community-card-copy">{description}</p>
        <span className="heritage-community-card-link">
          {cta}
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Prayer Requests, Community Chat and Shepherd AI, always reachable from the home page. */
export function HeritageCommunitySection({ model }: { model: ChurchWebsiteViewModel }) {
  const prayer = heritageCommunityCta(model, "prayer");
  const chat = heritageCommunityCta(model, "chat");
  const shepherd = heritageCommunityCta(model, "shepherd");
  const showPrayer = model.church.showPrayerWall !== false;

  return (
    <section
      aria-labelledby="heritage-community-heading"
      className="heritage-community-band"
    >
      <HeritageFrame>
        <div className="heritage-community-header">
          <p className="heritage-eyebrow">Community</p>
          <h2
            id="heritage-community-heading"
            className="heritage-display mt-3 text-[length:var(--heritage-section)]"
          >
            We&apos;re Stronger When We Pray Together.
          </h2>
          <p className="heritage-community-lede">
            {showPrayer
              ? "Share your prayer requests, connect with church members, and get spiritual guidance through meaningful conversations and Shepherd AI."
              : "Connect with church members and get spiritual guidance through meaningful conversations and Shepherd AI."}
          </p>
        </div>
        <div className="heritage-community-cards">
          {showPrayer ? (
          <FeatureCard
            href={prayer.href}
            image={HERITAGE_FALLBACK_IMAGES.communityPrayer}
            icon={<Heart className="size-4" />}
            title="Prayer Requests"
            description="Share a prayer request and let our community pray with you."
            cta="Submit a Request"
            imageClass="object-cover object-[center_58%]"
          />
          ) : null}
          <FeatureCard
            href={chat.href}
            image={HERITAGE_FALLBACK_IMAGES.communityChat}
            icon={<Users className="size-4" />}
            title="Community Chat"
            description="Connect with members, join discussions, and build meaningful relationships."
            cta="Open Chat"
            imageClass="object-cover object-[center_42%]"
          />
          <FeatureCard
            href={shepherd.href}
            image={HERITAGE_FALLBACK_IMAGES.communityShepherd}
            icon={<BookOpen className="size-4" />}
            title="Meet Shepherd AI"
            description="Your companion for Scripture, faith questions, and spiritual guidance."
            cta="Chat with Shepherd AI"
            imageClass="object-cover object-[center_48%]"
          />
        </div>
      </HeritageFrame>
    </section>
  );
}
