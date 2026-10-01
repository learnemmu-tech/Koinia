import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { heritageChurchPhotograph } from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

/**
 * Homepage ministry row matching the approved screenshot. These labels are the
 * layout when the church has not published ministries; they are not church records.
 */
const MINISTRY_LAYOUT_FALLBACKS = [
  {
    name: "Youth",
    description: "Next Generation",
    image: HERITAGE_FALLBACK_IMAGES.communityPrayer,
  },
  {
    name: "Worship",
    description: "Lift His Name",
    image: HERITAGE_FALLBACK_IMAGES.about,
  },
  {
    name: "Families",
    description: "Stronger Together",
    image: HERITAGE_FALLBACK_IMAGES.communityChat,
  },
  {
    name: "Outreach",
    description: "Serve Our Community",
    image: HERITAGE_FALLBACK_IMAGES.giving,
  },
] as const;

/**
 * Ministries on the homepage. About / Our Church lives on `/about`, not here.
 */
export function HeritageIntroductionSection({ model }: { model: ChurchWebsiteViewModel }) {
  if (!isSectionVisible(model.website.visibility, "ministries")) return null;

  const slug = model.church.slug;
  const ministriesHref = churchWebsitePath(slug, "/ministries");
  const cards =
    model.ministries.length > 0
      ? model.ministries.slice(0, 4).map((ministry) => ({
          name: ministry.name,
          description: ministry.description,
          image: heritageChurchPhotograph(
            model,
            ministry.imageUrl,
            HERITAGE_FALLBACK_IMAGES.featuredMinistry
          ),
        }))
      : MINISTRY_LAYOUT_FALLBACKS.map((item) => ({ ...item }));

  return (
    <section aria-labelledby="heritage-intro-heading" className="heritage-section">
      <HeritageFrame>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="max-w-lg">
            <p className="heritage-eyebrow">Our Ministries</p>
            <h2
              id="heritage-intro-heading"
              className="heritage-display mt-3 text-[length:var(--heritage-section)]"
            >
              Real People. Real Faith. Real Impact.
            </h2>
            <p className="mt-4 max-w-md text-[length:var(--heritage-body)] leading-[1.65] text-[var(--heritage-muted)]">
              Discover our ministries and find a place to serve, grow, and make a difference.
            </p>
            <div className="mt-8">
              <HeritageButton href={ministriesHref} variant="ghost" arrow>
                Explore All Ministries
              </HeritageButton>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((ministry, index) => (
              <li key={`${ministry.name}-${index}`}>
                <Link
                  href={ministriesHref}
                  className="heritage-photo-card group block min-h-[15.5rem] rounded-[0.75rem] sm:min-h-[16.5rem]"
                >
                  <HeritageImage
                    src={ministry.image}
                    alt=""
                    fallback={HERITAGE_FALLBACK_IMAGES.featuredMinistry}
                    sizes="(max-width: 1024px) 50vw, 14rem"
                  />
                  <div className="heritage-photo-card-scrim" />
                  <div className="absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between gap-2 p-3 text-[var(--heritage-primary-foreground)] sm:p-4">
                    <div className="min-w-0">
                      <h3 className="heritage-display text-[length:var(--heritage-card-title)] leading-snug">
                        {ministry.name}
                      </h3>
                      {ministry.description ? (
                        <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--heritage-primary-foreground)_82%,transparent)]">
                          {ministry.description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 opacity-90 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </HeritageFrame>
    </section>
  );
}
