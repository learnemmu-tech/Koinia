import { Play } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";
import type { ReactNode } from "react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { heritageJoinCta, resolveHeritageImage } from "@/templates/heritage/lib";
import {
  HERITAGE_FALLBACK_HEADLINE,
  HERITAGE_FALLBACK_IMAGES,
  HERITAGE_FALLBACK_SUPPORTING,
} from "@/templates/heritage/theme";

const heroHeading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

function renderHeroHeadline(headline: string): ReactNode {
  const lines = headline
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    const last = lines.at(-1)!;
    const lead = lines.slice(0, -1).join(" ");
    return (
      <>
        {lead}{" "}
        <span className="heritage-hero-accent">{last}</span>
      </>
    );
  }

  const community = headline.trim().match(/^(.*?)(\bCommunity\.?)$/i);
  if (community?.[1] && community[2]) {
    return (
      <>
        {community[1].trimEnd()}{" "}
        <span className="heritage-hero-accent">{community[2]}</span>
      </>
    );
  }

  const grow = headline.trim().match(/^(.*?)(Grow in Faith\.?)$/i);
  if (grow?.[1] && grow[2]) {
    return (
      <>
        {grow[1].trimEnd()}{" "}
        <span className="heritage-hero-accent">{grow[2]}</span>
      </>
    );
  }

  return headline;
}

export function HeritageHero({ model }: { model: ChurchWebsiteViewModel }) {
  const slug = model.church.slug;
  const visibility = model.website.visibility;
  const joinCta = heritageJoinCta(model);
  const image = resolveHeritageImage(
    model.website.images.hero,
    HERITAGE_FALLBACK_IMAGES.hero
  );
  const eyebrow = model.website.heroEyebrow?.trim() || `Welcome to ${model.church.name}`;
  const headline = model.website.heroHeadline?.trim() || HERITAGE_FALLBACK_HEADLINE;
  const supporting =
    model.website.heroSubheadline?.trim() || HERITAGE_FALLBACK_SUPPORTING;

  const visit = isSectionVisible(visibility, "contact")
    ? { href: churchWebsitePath(slug, "/contact"), label: "Plan Your Visit" }
    : isSectionVisible(visibility, "about")
      ? { href: churchWebsitePath(slug, "/about"), label: "Plan Your Visit" }
      : joinCta;
  const latestSermon = isSectionVisible(visibility, "sermons") ? model.sermons[0] : undefined;

  return (
    <section
      aria-label={`Welcome to ${model.church.name}`}
      className="heritage-hero heritage-on-dark"
    >
      <div className="heritage-hero-media">
        <HeritageImage
          src={image}
          alt=""
          priority
          quality={95}
          fallback={HERITAGE_FALLBACK_IMAGES.hero}
          className="object-cover"
          sizes="100vw"
        />
        <div className="heritage-hero-scrim" />
      </div>
      <HeritageFrame className="heritage-hero-copy-wrap">
        <div className="heritage-hero-copy">
          <p className="heritage-hero-kicker">{eyebrow}</p>
          <h1 className={`${heroHeading.className} heritage-hero-title`}>
            {renderHeroHeadline(headline)}
          </h1>
          <p className="heritage-hero-lede">{supporting}</p>
          <div className="heritage-hero-actions">
            <HeritageButton href={visit.href} variant="primary" arrow>
              {visit.label}
            </HeritageButton>
            {latestSermon ? (
              <HeritageButton
                href={churchWebsitePath(slug, `/sermons/${latestSermon.id}`)}
                variant="secondary"
              >
                <Play className="size-4 fill-current" aria-hidden />
                Watch Latest Sermon
              </HeritageButton>
            ) : visit.href !== joinCta.href ? (
              <HeritageButton href={joinCta.href} variant="secondary">
                {joinCta.label}
              </HeritageButton>
            ) : null}
          </div>
        </div>
      </HeritageFrame>
    </section>
  );
}
