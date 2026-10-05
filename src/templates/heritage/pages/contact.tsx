import { getTranslations } from "next-intl/server";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritagePrayerForm } from "@/templates/heritage/components/heritage-prayer-form";
import { formatChurchAddress, heritageJoinCta } from "@/templates/heritage/lib";

export async function HeritageContactPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.contact");
  const tCommon = await getTranslations("heritage.common");
  const address = formatChurchAddress(model);

  return (
    <section className="heritage-content-system mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <p className="heritage-eyebrow">{t("eyebrow")}</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        {t("title")}
      </h1>
      <div className="heritage-rule mt-6" />
      <dl className="mt-10 space-y-6 text-[var(--heritage-muted)]">
        {address ? (
          <div>
            <dt className="heritage-eyebrow">{t("address")}</dt>
            <dd className="mt-2 text-lg text-[var(--heritage-text)]">{address}</dd>
          </div>
        ) : null}
        {model.church.email ? (
          <div>
            <dt className="heritage-eyebrow">{t("email")}</dt>
            <dd className="mt-2">
              <a href={`mailto:${model.church.email}`}>{model.church.email}</a>
            </dd>
          </div>
        ) : null}
        {model.church.phone ? (
          <div>
            <dt className="heritage-eyebrow">{t("phone")}</dt>
            <dd className="mt-2">
              <a href={`tel:${model.church.phone}`}>{model.church.phone}</a>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-10">
        <HeritageButton href={churchWebsitePath(model.church.slug)}>
          {tCommon("backHome")}
        </HeritageButton>
      </div>
    </section>
  );
}

export async function HeritagePrayerPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.prayer");
  const tCommon = await getTranslations("heritage.common");
  const joinCta = heritageJoinCta(model);
  return (
    <section className="heritage-content-system mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <p className="heritage-eyebrow">{t("eyebrow")}</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        {t("need")}
      </h1>
      <div className="heritage-rule mx-auto mt-6" />
      <p className="mt-6 text-[var(--heritage-muted)]">
        {t("intro", { name: model.church.name })}
      </p>
      <HeritagePrayerForm model={model} />
      <p className="mt-8 text-sm text-[var(--heritage-muted)]">
        {t("lookingHome")}{" "}
        <a className="underline" href={joinCta.href}>
          {tCommon("joinOurChurch")}
        </a>
        .
      </p>
    </section>
  );
}
