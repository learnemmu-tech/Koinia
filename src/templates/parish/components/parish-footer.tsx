import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { formatChurchAddress } from "@/templates/heritage/lib";
import {
  getParishPageLinks,
  getParishPrimaryNavLinks,
  parishNavMessageKey,
} from "@/templates/parish/public-nav";

export async function ParishFooter({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.nav");
  const labelOf = (label: string) => {
    const key = parishNavMessageKey(label);
    return key ? t(key) : label;
  };
  const address = formatChurchAddress(model);
  const explore = getParishPrimaryNavLinks(model);
  const resources = getParishPageLinks(model).filter(
    (item) => !explore.some((link) => link.href === item.href)
  );

  return (
    <footer className="parish-footer">
      <div className="parish-footer-inner">
        <div>
          <p className="parish-display text-3xl text-[#F4EFE4]">{model.church.name}</p>
          {model.church.welcomeMessage ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#E3D6C2]">
              {model.church.welcomeMessage}
            </p>
          ) : null}
        </div>
        <div>
          <p className="parish-eyebrow text-[#C6A36A]">{t("visit")}</p>
          {address ? <p className="mt-3 text-sm leading-relaxed">{address}</p> : null}
          {model.website.serviceTime ? (
            <p className="mt-2 text-sm">
              {model.website.serviceLabel ? `${model.website.serviceLabel}: ` : null}
              {model.website.serviceTime}
            </p>
          ) : null}
          {model.church.email ? (
            <p className="mt-2 text-sm">
              <a href={`mailto:${model.church.email}`}>{model.church.email}</a>
            </p>
          ) : null}
          {model.church.phone ? (
            <p className="mt-2 text-sm">
              <a href={`tel:${model.church.phone}`}>{model.church.phone}</a>
            </p>
          ) : null}
        </div>
        <nav aria-label="Explore" className="grid gap-1 text-sm">
          <p className="parish-eyebrow text-[#C6A36A]">{t("explore")}</p>
          {explore.map((item) => (
            <Link key={item.href} href={item.href}>
              {labelOf(item.label)}
            </Link>
          ))}
        </nav>
        <nav aria-label="Resources" className="grid gap-1 text-sm">
          <p className="parish-eyebrow text-[#C6A36A]">{t("resources")}</p>
          {resources.map((item) => (
            <Link key={`${item.href}:${item.label}`} href={item.href}>
              {labelOf(item.label)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="parish-footer-base">
        {Object.entries(model.website.socialLinks).map(([name, href]) =>
          href ? (
            <a key={name} href={href} rel="noreferrer">
              {name}
            </a>
          ) : null
        )}
        <p>© {new Date().getFullYear()} {model.church.name}</p>
      </div>
    </footer>
  );
}
