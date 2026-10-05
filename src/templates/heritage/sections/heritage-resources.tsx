"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel, WebsiteVisibilityKey } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

type Resource = {
  label: string;
  path: string;
  copy: string;
  image: string;
  section?: WebsiteVisibilityKey;
  copyKey: "sermonsCopy" | "songsCopy" | "articlesCopy" | "videosCopy";
  labelKey: "sermons" | "songs" | "articles" | "videos";
};

const RESOURCES: Resource[] = [
  {
    label: "Sermons",
    path: "/sermons",
    copy: "Biblical messages to strengthen your faith.",
    image: HERITAGE_FALLBACK_IMAGES.featuredSermon,
    section: "sermons",
    copyKey: "sermonsCopy",
    labelKey: "sermons",
  },
  {
    label: "Songs",
    path: "/songs",
    copy: "Worship and praise for your daily walk.",
    image: HERITAGE_FALLBACK_IMAGES.songs,
    copyKey: "songsCopy",
    labelKey: "songs",
  },
  {
    label: "Articles",
    path: "/articles",
    copy: "Explore Scripture and Christian living.",
    image: HERITAGE_FALLBACK_IMAGES.library,
    section: "articles",
    copyKey: "articlesCopy",
    labelKey: "articles",
  },
  {
    label: "Videos",
    path: "/videos",
    copy: "Watch inspiring Christian content.",
    image: HERITAGE_FALLBACK_IMAGES.videos,
    section: "videos",
    copyKey: "videosCopy",
    labelKey: "videos",
  },
];

/** Resource hub for sermons, songs, articles, and videos. */
export function HeritageResourcesSection({ model }: { model: ChurchWebsiteViewModel }) {
  const t = useTranslations("heritage.resources");
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
          <p className="heritage-eyebrow heritage-resources-eyebrow">{t("eyebrow")}</p>
          <h2
            id="heritage-resources-heading"
            className="heritage-display heritage-resources-title"
          >
            {t("titleLead")}{" "}
            <span className="heritage-resources-accent">{t("titleAccent")}</span>
          </h2>
          <p className="heritage-resources-lede">{t("lede")}</p>
        </header>
        <ul className="heritage-resources-grid">
          {items.map((item) => (
            <li key={item.path}>
              <Link href={churchWebsitePath(slug, item.path)} className="heritage-resource">
                <span className="heritage-resource-copy">
                  <span className="heritage-resource-rule" aria-hidden />
                  <span className="heritage-resource-label">{t(item.labelKey)}</span>
                  <span className="heritage-resource-text">{t(item.copyKey)}</span>
                  <span className="heritage-resource-cta">
                    {t("learnMore")}
                    <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                  </span>
                </span>
                <span className="heritage-resource-photo">
                  <HeritageImage src={item.image} alt="" sizes="(max-width: 767px) 38vw, 160px" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HeritageFrame>
    </section>
  );
}
