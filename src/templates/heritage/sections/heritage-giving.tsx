import { Church, HeartHandshake, Sprout } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

/**
 * Invitation to give. It only links to the existing giving pages; the donation itself
 * and its confirmation stay in the payment flow.
 */
export function HeritageGivingSection({ model }: { model: ChurchWebsiteViewModel }) {
  if (!isSectionVisible(model.website.visibility, "giving")) return null;

  const slug = model.church.slug;
  const [campaign] = model.campaigns;
  const giveHref = campaign
    ? churchWebsitePath(slug, `/give/${campaign.id}`)
    : churchWebsitePath(slug, "/give");

  return (
    <section
      aria-labelledby="heritage-giving-heading"
      className="overflow-hidden bg-[var(--heritage-surface)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div className="heritage-media relative min-h-[14rem] lg:min-h-[18rem]">
          <HeritageImage
            src={HERITAGE_FALLBACK_IMAGES.giving}
            alt=""
            fallback={HERITAGE_FALLBACK_IMAGES.giving}
            sizes="(max-width: 1024px) 100vw, 46vw"
          />
        </div>
        <HeritageFrame className="flex flex-col justify-center py-10 sm:py-12 lg:py-12">
          <p className="heritage-eyebrow">Give with purpose</p>
          <h2
            id="heritage-giving-heading"
            className="heritage-display mt-3 max-w-xl text-[length:var(--heritage-section)]"
          >
            {campaign?.title || "Your Generosity Changes Lives."}
          </h2>
          <p className="mt-4 max-w-xl text-[var(--heritage-muted)]">
            {campaign?.description ||
              `Support our church, our ministries, and the people we serve. Together we can make a lasting impact.`}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <HeritageButton href={giveHref} variant="oxblood" arrow>
              Give Online
            </HeritageButton>
            <HeritageButton
              href={
                model.campaigns.length > 1 ? churchWebsitePath(slug, "/give") : giveHref
              }
              variant="ghost"
              arrow
            >
              Learn More
            </HeritageButton>
          </div>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-0">
            {[
              { icon: Church, label: "Support Ministries" },
              { icon: HeartHandshake, label: "Care for Community" },
              { icon: Sprout, label: "Build a Brighter Future" },
            ].map((item, index) => (
              <li
                key={item.label}
                className={
                  index === 0
                    ? "flex flex-col items-start gap-3 sm:pr-8"
                    : "flex flex-col items-start gap-3 sm:border-l sm:border-[var(--heritage-border)] sm:px-8"
                }
              >
                <item.icon className="size-7 text-[var(--heritage-primary)]" aria-hidden />
                <span className="text-sm font-semibold leading-snug text-[var(--heritage-text)]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </HeritageFrame>
      </div>
    </section>
  );
}
