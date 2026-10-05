import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import { HeritageFeaturedSermon } from "@/templates/heritage/sections/heritage-featured-sermon";
import {
  formatChurchAddress,
  heritageDirectionsHref,
} from "@/templates/heritage/lib";

/** Service information and the featured sermon share one composed row. */
export async function HeritageWorshipSermonSection({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.worship");
  const tCommon = await getTranslations("heritage.common");
  const slug = model.church.slug;
  const visibility = model.website.visibility;
  const serviceLabel = model.website.serviceLabel?.trim();
  const serviceTime = model.website.serviceTime?.trim();
  const serviceLocation = model.website.serviceLocation?.trim();
  const address = formatChurchAddress(model);
  const hasService = Boolean(serviceLabel || serviceTime || serviceLocation || address);
  const showSermon = isSectionVisible(visibility, "sermons");
  if (!hasService && !showSermon) return null;

  const sermons = showSermon ? model.sermons : [];
  const directions = heritageDirectionsHref(address);
  const aboutVisible = isSectionVisible(visibility, "about");
  const expectHref = aboutVisible
    ? churchWebsitePath(slug, "/about")
    : isSectionVisible(visibility, "contact")
      ? churchWebsitePath(slug, "/contact")
      : null;
  const scriptureText = model.website.scriptureText?.trim();
  const scriptureRef = model.website.scriptureReference?.trim();

  return (
    <section className="heritage-worship-band" aria-label={t("aria")}>
      <HeritageFrame
        className={
          hasService && showSermon
            ? "grid min-w-0 items-center gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.38fr)] lg:gap-12"
            : "max-w-5xl"
        }
      >
        {hasService ? (
          <div className="heritage-leaf-panel relative z-[1] min-w-0">
            <p className="heritage-eyebrow heritage-kicker-with-rule">
              {serviceLabel || t("sunday")}
            </p>
            <h2 className="heritage-display heritage-worship-heading mt-3">
              {t("joinLead")} <span className="heritage-worship-accent">{t("joinAccent")}</span>
            </h2>
            <p className="mt-3 max-w-md text-[var(--heritage-muted)]">
              {t("lede")}
            </p>
            <div className="heritage-worship-meta">
              {serviceTime ? (
                <p>
                  <CalendarDays className="size-4" aria-hidden />
                  <span>{serviceTime}</span>
                </p>
              ) : null}
              {serviceLocation || address ? (
                <p>
                  <MapPin className="size-4" aria-hidden />
                  <span>
                    {address || serviceLocation}
                    {serviceLocation && address && address !== serviceLocation
                      ? ` · ${serviceLocation}`
                      : null}
                  </span>
                </p>
              ) : null}
            </div>
            {directions || expectHref ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {directions ? (
                  <a
                    href={directions}
                    target="_blank"
                    rel="noreferrer"
                    className="heritage-btn heritage-btn-oxblood"
                  >
                    {t("directions")}
                    <ArrowRight className="size-4" aria-hidden />
                    <span className="sr-only"> {tCommon("opensMap")}</span>
                  </a>
                ) : null}
                {expectHref ? (
                  <HeritageButton href={expectHref} variant="outline" arrow>
                    {t("expect")}
                  </HeritageButton>
                ) : null}
              </div>
            ) : null}
            {scriptureText ? (
              <figure className="heritage-worship-quote">
                <blockquote>“{scriptureText}”</blockquote>
                {scriptureRef ? <figcaption>{scriptureRef}</figcaption> : null}
              </figure>
            ) : null}
          </div>
        ) : null}

        {showSermon ? (
          <HeritageFeaturedSermon model={model} sermons={sermons} />
        ) : null}
      </HeritageFrame>
    </section>
  );
}
