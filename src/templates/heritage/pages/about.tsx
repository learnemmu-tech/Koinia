import { getTranslations } from "next-intl/server";
import {
  BookOpen,
  Church,
  HeartHandshake,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import {
  defaultAboutBeliefs,
  defaultAboutCommunity,
  defaultAboutMission,
  defaultAboutValues,
  resolveAboutHeadline,
  resolveAboutIntro,
} from "@/lib/templates/about-content";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageAboutBeliefs } from "@/templates/heritage/components/heritage-about-beliefs";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import {
  formatChurchAddress,
  heritageChurchPhotograph,
  heritageCommunityCta,
  heritageJoinCta,
} from "@/templates/heritage/lib";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

function valueIcon(title: string): ReactNode {
  const key = title.trim().toLowerCase();
  if (key.includes("scripture") || key.includes("bible") || key.includes("word")) {
    return <BookOpen className="size-5" aria-hidden />;
  }
  if (key.includes("community") || key.includes("family") || key.includes("together")) {
    return <Users className="size-5" aria-hidden />;
  }
  if (key.includes("welcome") || key.includes("love") || key.includes("hospital")) {
    return <HeartHandshake className="size-5" aria-hidden />;
  }
  if (key.includes("worship") || key.includes("gather")) {
    return <Church className="size-5" aria-hidden />;
  }
  return <Sparkles className="size-5" aria-hidden />;
}

function pastorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function HeritageAboutPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.about");
  const tNav = await getTranslations("heritage.nav");
  const tCommon = await getTranslations("heritage.common");
  const name = model.church.name;
  const slug = model.church.slug;
  const heading = resolveAboutHeadline(model.website.aboutHeadline, name);
  const intro = resolveAboutIntro(
    model.website.aboutIntro,
    model.church.description,
    model.church.welcomeMessage,
    name
  );
  const mission =
    model.website.aboutMission?.trim() || defaultAboutMission(name);
  const vision = model.website.aboutVision?.trim() || "";
  const communityCopy =
    model.website.aboutCommunity?.trim() || defaultAboutCommunity(name);
  const values =
    model.website.aboutValues.length > 0
      ? model.website.aboutValues
      : defaultAboutValues();
  const beliefs =
    model.website.aboutBeliefs.length > 0
      ? model.website.aboutBeliefs
      : defaultAboutBeliefs(name);
  const aboutImage = heritageChurchPhotograph(
    model,
    model.website.images.about,
    HERITAGE_FALLBACK_IMAGES.about
  );
  const storyImage = heritageChurchPhotograph(
    model,
    model.website.images.worship || model.website.images.hero,
    HERITAGE_FALLBACK_IMAGES.worship
  );
  const communityImage = heritageChurchPhotograph(
    model,
    model.website.images.featuredMinistry,
    HERITAGE_FALLBACK_IMAGES.communityPrayer
  );
  const address = formatChurchAddress(model);
  const contactVisible = isSectionVisible(model.website.visibility, "contact");
  const sermonsVisible = isSectionVisible(model.website.visibility, "sermons");
  const ministriesVisible = isSectionVisible(model.website.visibility, "ministries");
  const visitHref = contactVisible
    ? churchWebsitePath(slug, "/contact")
    : churchWebsitePath(slug);
  const joinCta = heritageJoinCta(model);
  const prayer = heritageCommunityCta(model, "prayer");
  const pastor = model.church.pastorName?.trim();
  const established = model.church.establishedYear;

  return (
    <article className="heritage-about-page">
      <section className="heritage-about-hero" aria-labelledby="heritage-about-heading">
        <HeritageFrame className="heritage-about-hero-grid">
          <div className="heritage-about-hero-copy">
            <p className="heritage-eyebrow">{t("who")}</p>
            <h1 id="heritage-about-heading" className="heritage-display heritage-about-hero-title">
              {heading}
            </h1>
            <p className="heritage-about-lede">{intro}</p>
            <div className="heritage-about-actions">
              <HeritageButton href={visitHref}>{t("visit")}</HeritageButton>
              <HeritageButton href={joinCta.href} variant="outline">
                {tCommon("joinOurChurch")}
              </HeritageButton>
            </div>
          </div>
          <div className="heritage-about-hero-media">
            <HeritageImage
              src={aboutImage}
              alt={t("churchAlt", { name })}
              fallback={HERITAGE_FALLBACK_IMAGES.about}
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
          </div>
        </HeritageFrame>
      </section>

      <section className="heritage-about-band" aria-labelledby="heritage-about-story">
        <HeritageFrame className="heritage-about-split">
          <div className="heritage-about-photo">
            <HeritageImage
              src={storyImage}
              alt=""
              fallback={HERITAGE_FALLBACK_IMAGES.worship}
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </div>
          <div>
            <p className="heritage-eyebrow">{t("story")}</p>
            <h2 id="heritage-about-story" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
              {t("gathered")}
            </h2>
            <p className="mt-4 whitespace-pre-line text-[var(--heritage-muted)]">{intro}</p>
            {established || address ? (
              <dl className="heritage-about-facts">
                {established ? (
                  <div>
                    <dt>{t("established")}</dt>
                    <dd>{established}</dd>
                  </div>
                ) : null}
                {address ? (
                  <div>
                    <dt>{t("location")}</dt>
                    <dd>{address}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        </HeritageFrame>
      </section>

      <section className="heritage-about-mission" aria-labelledby="heritage-about-mission">
        <HeritageFrame className="heritage-about-mission-inner">
          <p className="heritage-eyebrow heritage-eyebrow-dark">{t("mission")}</p>
          <h2 id="heritage-about-mission" className="heritage-display mt-3">
            {t("why")}
          </h2>
          <p>{mission}</p>
          {vision ? (
            <figure className="heritage-about-vision">
              <figcaption>{t("vision")}</figcaption>
              <blockquote>{vision}</blockquote>
            </figure>
          ) : null}
        </HeritageFrame>
      </section>

      <section className="heritage-about-band" aria-labelledby="heritage-about-values">
        <HeritageFrame>
          <p className="heritage-eyebrow">{t("values")}</p>
          <h2 id="heritage-about-values" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
            {t("shapes")}
          </h2>
          <ul className="heritage-about-values">
            {values.map((value) => (
              <li key={value.title} className="heritage-about-value-card">
                <span className="heritage-about-value-icon" aria-hidden>
                  {valueIcon(value.title)}
                </span>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </li>
            ))}
          </ul>
        </HeritageFrame>
      </section>

      <section className="heritage-about-band heritage-about-band-surface" aria-labelledby="heritage-about-believe">
        <HeritageFrame className="heritage-about-believe">
          <div>
            <p className="heritage-eyebrow">{t("believe")}</p>
            <h2 id="heritage-about-believe" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
              {t("faithGuides")}
            </h2>
            <p className="mt-4 max-w-xl text-[var(--heritage-muted)]">
              {t("beliefsNote")}
            </p>
          </div>
          <HeritageAboutBeliefs items={beliefs} />
        </HeritageFrame>
      </section>

      <section className="heritage-about-band" aria-labelledby="heritage-about-community">
        <HeritageFrame className="heritage-about-split">
          <div>
            <p className="heritage-eyebrow">{t("community")}</p>
            <h2 id="heritage-about-community" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
              {t("place")}
            </h2>
            <p className="mt-4 whitespace-pre-line text-[var(--heritage-muted)]">
              {communityCopy}
            </p>
            <div className="heritage-about-connect">
              {sermonsVisible ? (
                <HeritageButton href={churchWebsitePath(slug, "/sermons")} variant="outline">
                  {tNav("sermons")}
                </HeritageButton>
              ) : null}
              {ministriesVisible ? (
                <HeritageButton href={churchWebsitePath(slug, "/ministries")} variant="outline">
                  {tNav("ministries")}
                </HeritageButton>
              ) : null}
              <HeritageButton href={prayer.href} variant="outline">
                {tNav("prayer")}
              </HeritageButton>
              <HeritageButton href={churchWebsitePath(slug, "/community")} variant="outline">
                {tNav("community")}
              </HeritageButton>
            </div>
          </div>
          <div className="heritage-about-photo">
            <HeritageImage
              src={communityImage}
              alt=""
              fallback={HERITAGE_FALLBACK_IMAGES.communityPrayer}
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </div>
        </HeritageFrame>
      </section>

      {pastor ? (
        <section className="heritage-about-band heritage-about-band-surface" aria-labelledby="heritage-about-leadership">
          <HeritageFrame>
            <p className="heritage-eyebrow">{t("leadership")}</p>
            <h2 id="heritage-about-leadership" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
              {t("pastor")}
            </h2>
            <article className="heritage-about-leader">
              <span className="heritage-about-leader-mark" aria-hidden>
                {pastorInitials(pastor)}
              </span>
              <div>
                <h3>{pastor}</h3>
                <p>{t("pastorRole")}</p>
              </div>
            </article>
          </HeritageFrame>
        </section>
      ) : null}

      <section className="heritage-about-cta" aria-labelledby="heritage-about-visit">
        <HeritageFrame className="heritage-about-cta-inner">
          <p className="heritage-eyebrow">{t("visitEyebrow")}</p>
          <h2 id="heritage-about-visit" className="heritage-display mt-3 text-[length:var(--heritage-section)]">
            {t("sunday")}
          </h2>
          <p>
            {t("sundayLede", { name })}
          </p>
          <div className="heritage-about-actions">
            <HeritageButton href={visitHref}>{t("visit")}</HeritageButton>
            <HeritageButton href={joinCta.href} variant="outline">
              {tCommon("joinOurChurch")}
            </HeritageButton>
          </div>
        </HeritageFrame>
      </section>
    </article>
  );
}
