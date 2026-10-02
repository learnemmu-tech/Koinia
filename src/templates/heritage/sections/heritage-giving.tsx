import { Church, HeartHandshake, Sprout } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

const givingHeading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal"],
  display: "swap",
});

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
  const learnMoreHref =
    model.campaigns.length > 1 ? churchWebsitePath(slug, "/give") : giveHref;

  return (
    <section
      aria-labelledby="heritage-giving-heading"
      className="heritage-giving"
    >
      <div className="heritage-giving-banner">
        <div className="heritage-giving-photo">
          <HeritageImage
            src={HERITAGE_FALLBACK_IMAGES.giving}
            alt=""
            fallback={HERITAGE_FALLBACK_IMAGES.giving}
            className="object-cover object-[70%_40%]"
            sizes="100vw"
          />
        </div>
        <div className="heritage-giving-scrim" />
        <div className="heritage-giving-main">
          <p className="heritage-giving-kicker">Give with purpose</p>
          <h2
            id="heritage-giving-heading"
            className={`${givingHeading.className} heritage-giving-title`}
          >
            {campaign?.title || "Your Generosity Changes Lives."}
          </h2>
          <p className="heritage-giving-lede">
            {campaign?.description ||
              `Support our church, our ministries, and the people we serve. Together we can make a lasting impact.`}
          </p>
          <div className="heritage-giving-actions">
            <HeritageButton href={giveHref} variant="primary" arrow>
              Give Online
            </HeritageButton>
            <HeritageButton href={learnMoreHref} variant="secondary" arrow>
              Learn More
            </HeritageButton>
          </div>
        </div>
        <ul className="heritage-giving-strip">
          {[
            { icon: Church, label: "Support Ministries" },
            { icon: HeartHandshake, label: "Care for Community" },
            { icon: Sprout, label: "Build a Brighter Future" },
          ].map((item) => (
            <li key={item.label}>
              <item.icon aria-hidden />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
