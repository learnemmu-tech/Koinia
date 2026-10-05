import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { heritageCommunityCta } from "@/templates/heritage/lib";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

type Feature = {
  href: string;
  index: string;
  eyebrow: string;
  titleLead: string;
  titleRest: string;
  description: string;
  cta: string;
  image: string;
  alt: string;
};

/** Community Chat, Shepherd AI, and groups. Prayer stays on the wall above. */
export async function HeritageCommunitySection({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.community");
  const prayer = heritageCommunityCta(model, "prayer");
  const chat = heritageCommunityCta(model, "chat");
  const shepherd = heritageCommunityCta(model, "shepherd");
  const groups = heritageCommunityCta(model, "groups");
  const showPrayer = model.church.showPrayerWall !== false;

  const features: Feature[] = [
    {
      href: chat.href,
      index: "02",
      eyebrow: t("chatTitle"),
      titleLead: t("chatHeadlineLead"),
      titleRest: t("chatHeadlineRest"),
      description: t("chatCopy"),
      cta: t("chatExplore"),
      image: HERITAGE_FALLBACK_IMAGES.communityChat,
      alt: t("chatImageAlt"),
    },
    {
      href: shepherd.href,
      index: "03",
      eyebrow: t("shepherdPrompt"),
      titleLead: t("shepherdTitle"),
      titleRest: "",
      description: t("shepherdCopy"),
      cta: t("shepherdCta"),
      image: HERITAGE_FALLBACK_IMAGES.communityShepherd,
      alt: t("shepherdImageAlt"),
    },
    {
      href: groups.href,
      index: "04",
      eyebrow: t("groupsTitle"),
      titleLead: t("groupsHeadlineLead"),
      titleRest: t("groupsHeadlineRest"),
      description: t("groupsCopy"),
      cta: t("groupsCta"),
      image: HERITAGE_FALLBACK_IMAGES.worship,
      alt: t("groupsImageAlt"),
    },
  ].map((feature, position) => ({
    ...feature,
    index: String(position + 1).padStart(2, "0"),
  }));

  return (
    <section
      aria-labelledby="heritage-community-heading"
      className="heritage-community-band"
    >
      <HeritageFrame className="heritage-community-inner">
        <div className="heritage-community-stage">
          <header className="heritage-community-header">
            <p className="heritage-eyebrow heritage-kicker-with-rule">{t("eyebrow")}</p>
            <h2
              id="heritage-community-heading"
              className="heritage-display heritage-community-title"
            >
              {t("titleLead")}{" "}
              <span className="heritage-community-accent">{t("titleAccent")}</span>
            </h2>
            <p className="heritage-community-lede">
              {showPrayer ? t("lede") : t("ledeNoPrayer")}
            </p>
            <Link href={shepherd.href} className="heritage-community-shepherd">
              <span className="heritage-community-shepherd-kicker">{t("shepherdPrompt")}</span>
              <span className="heritage-community-shepherd-cta">
                {t("shepherdTitle")}
                <ArrowRight className="size-3.5 shrink-0" aria-hidden />
              </span>
            </Link>
          </header>

          {showPrayer ? (
            <Link href={prayer.href} className="heritage-community-wall">
              <span className="heritage-community-wall-copy">
                <span className="heritage-community-wall-kicker">{t("wallEyebrow")}</span>
                <span className="heritage-display heritage-community-wall-title">
                  {t("wallTitleLead")}{" "}
                  <span className="heritage-community-wall-title-rest">{t("wallTitleRest")}</span>
                </span>
                <span className="heritage-community-wall-text">{t("prayerCopy")}</span>
                <span className="heritage-community-wall-cta">
                  {t("prayerCta")}
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                </span>
              </span>
              <span className="heritage-community-wall-photo">
                <HeritageImage
                  src={HERITAGE_FALLBACK_IMAGES.library}
                  alt={t("wallImageAlt")}
                  sizes="(max-width: 767px) 100vw, 34vw"
                />
              </span>
            </Link>
          ) : null}
        </div>

        <ul className="heritage-community-features">
          {features.map((feature) => (
            <li key={feature.eyebrow}>
              <Link href={feature.href} className="heritage-community-feature">
                <span className="heritage-community-feature-copy">
                  <span className="heritage-community-feature-meta">
                    <span className="heritage-community-feature-index">{feature.index}</span>
                    <span className="heritage-community-feature-rule" aria-hidden />
                    <span className="heritage-community-feature-eyebrow">{feature.eyebrow}</span>
                  </span>
                  <span className="heritage-display heritage-community-feature-title">
                    {feature.titleLead}
                    {feature.titleRest ? (
                      <>
                        {" "}
                        <span className="heritage-community-feature-title-rest">
                          {feature.titleRest}
                        </span>
                      </>
                    ) : null}
                  </span>
                  <span className="heritage-community-feature-text">{feature.description}</span>
                  <span className="heritage-community-feature-cta">
                    {feature.cta}
                    <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                  </span>
                </span>
                <span className="heritage-community-feature-photo">
                  <HeritageImage
                    src={feature.image}
                    alt={feature.alt}
                    className="heritage-community-feature-img"
                    sizes="(max-width: 767px) 92vw, 22vw"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HeritageFrame>
    </section>
  );
}
