import Link from "next/link";
import { ArrowRight, CirclePlay, FileText, Music, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel, WebsiteVisibilityKey } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

const resourcesHeading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

type Resource = {
  label: string;
  path: string;
  icon: LucideIcon;
  section?: WebsiteVisibilityKey;
};

const RESOURCES: Resource[] = [
  { label: "Sermons", path: "/sermons", icon: CirclePlay, section: "sermons" },
  { label: "Songs", path: "/songs", icon: Music },
  { label: "Articles", path: "/articles", icon: FileText, section: "articles" },
  { label: "Videos", path: "/videos", icon: Video, section: "videos" },
];

/** Library entry point over a photographic band, matching the approved homepage. */
export function HeritageResourcesSection({ model }: { model: ChurchWebsiteViewModel }) {
  const slug = model.church.slug;
  const items = RESOURCES.filter(
    (item) => !item.section || isSectionVisible(model.website.visibility, item.section)
  );
  if (items.length === 0) return null;

  const libraryHref =
    items.find((item) => item.path === "/sermons")?.path ?? items[0]!.path;

  return (
    <section
      aria-labelledby="heritage-resources-heading"
      className="heritage-resources heritage-on-dark relative isolate overflow-hidden bg-[var(--heritage-secondary)] text-[var(--heritage-primary-foreground)]"
    >
      <div className="absolute inset-0 -z-10">
        <HeritageImage
          src={HERITAGE_FALLBACK_IMAGES.library}
          alt=""
          fallback={HERITAGE_FALLBACK_IMAGES.library}
          className="object-cover object-[center_48%]"
          sizes="100vw"
        />
        <div className="heritage-library-scrim" />
      </div>
      <HeritageFrame className="heritage-resources-inner">
        <div className="heritage-resources-copy">
          <p className="heritage-resources-kicker">Grow in your faith</p>
          <h2
            id="heritage-resources-heading"
            className={`${resourcesHeading.className} heritage-resources-title`}
          >
            Sermons, Songs, Articles
            <br />
            and More.
          </h2>
          <p className="heritage-resources-lede">
            Explore biblically grounded content to encourage your spiritual journey.
          </p>
          <div className="heritage-resources-action">
            <HeritageButton
              href={churchWebsitePath(slug, libraryHref)}
              variant="primary"
              arrow
              className="heritage-resources-button"
            >
              View All Resources
            </HeritageButton>
          </div>
        </div>
        <ul className="heritage-resources-cards">
          {items.map((item) => (
            <li key={item.path}>
              <Link
                href={churchWebsitePath(slug, item.path)}
                className="heritage-resource-card"
              >
                <item.icon className="heritage-resource-card-icon" aria-hidden />
                <span className="heritage-resource-card-label">{item.label}</span>
                <span className="heritage-resource-card-foot">
                  <span className="heritage-resource-card-rule" aria-hidden />
                  <ArrowRight className="heritage-resource-card-arrow" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HeritageFrame>
    </section>
  );
}
