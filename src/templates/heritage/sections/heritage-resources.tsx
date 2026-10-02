import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel, WebsiteVisibilityKey } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";

type Resource = {
  label: string;
  path: string;
  copy: string;
  section?: WebsiteVisibilityKey;
};

const RESOURCES: Resource[] = [
  {
    label: "Sermons",
    path: "/sermons",
    copy: "Biblical messages to strengthen your faith.",
    section: "sermons",
  },
  { label: "Songs", path: "/songs", copy: "Worship and praise for your daily walk." },
  {
    label: "Articles",
    path: "/articles",
    copy: "Explore Scripture and Christian living.",
    section: "articles",
  },
  {
    label: "Videos",
    path: "/videos",
    copy: "Watch inspiring Christian content.",
    section: "videos",
  },
];

/** Resource hub for sermons, songs, articles, and videos. */
export function HeritageResourcesSection({ model }: { model: ChurchWebsiteViewModel }) {
  const slug = model.church.slug;
  const items = RESOURCES.filter(
    (item) => !item.section || isSectionVisible(model.website.visibility, item.section)
  );
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="heritage-resources-heading"
      className="heritage-resources"
    >
      <HeritageFrame className="heritage-resources-inner">
        <header className="heritage-resources-header">
          <p className="heritage-eyebrow">Grow in your faith</p>
          <h2
            id="heritage-resources-heading"
            className="heritage-display heritage-resources-title"
          >
            Sermons, Songs, Articles and{" "}
            <span className="heritage-resources-accent">More.</span>
          </h2>
          <p className="heritage-resources-lede">
            Explore biblically grounded content to encourage your spiritual journey.
          </p>
        </header>
        <ul className="heritage-resources-grid">
          {items.map((item) => (
            <li key={item.path}>
              <Link href={churchWebsitePath(slug, item.path)} className="heritage-resource-card">
                <span className="heritage-resource-card-label">{item.label}</span>
                <span className="heritage-resource-card-copy">{item.copy}</span>
                <span className="heritage-resource-card-cta">
                  Learn More
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HeritageFrame>
    </section>
  );
}
