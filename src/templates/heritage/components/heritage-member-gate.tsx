import { getTranslations } from "next-intl/server";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { heritageJoinChurchHref, heritageLoginHref } from "@/templates/heritage/lib";
import { heritageNavMessageKey } from "@/templates/heritage/public-nav";

export async function HeritageMemberGate({
  model,
  featureLabel,
}: {
  model: ChurchWebsiteViewModel;
  featureLabel: string;
}) {
  const t = await getTranslations("heritage.gate");
  const tNav = await getTranslations("heritage.nav");
  const tCommon = await getTranslations("heritage.common");
  const featureKey = heritageNavMessageKey(featureLabel);
  const feature = featureKey ? tNav(featureKey) : featureLabel;
  return (
    <section className="mx-auto max-w-2xl px-4 py-10 text-center sm:px-6 lg:py-12">
      <p className="heritage-eyebrow">{t("eyebrow")}</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        {t("title")}
      </h1>
      <p className="mt-5 text-[var(--heritage-muted)]">
        {t("body", { feature, name: model.church.name })}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <HeritageButton href={heritageJoinChurchHref(model)} arrow>
          {tCommon("joinOurChurch")}
        </HeritageButton>
        {!model.viewer.isAuthenticated ? (
          <HeritageButton
            href={heritageLoginHref(model, churchWebsitePath(model.church.slug))}
            variant="outline"
          >
            {t("signIn")}
          </HeritageButton>
        ) : null}
      </div>
      <p className="mt-8">
        <HeritageButton href={churchWebsitePath(model.church.slug)} variant="ghost">
          {t("returnPublic")}
        </HeritageButton>
      </p>
    </section>
  );
}
