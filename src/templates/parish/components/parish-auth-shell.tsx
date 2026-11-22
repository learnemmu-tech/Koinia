import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";

import "@/templates/parish/parish.css";

export function ParishAuthShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: ReactNode;
}) {
  const logo = model.website.images.logo || model.church.logoUrl;
  const homeHref = churchWebsitePath(model.church.slug);
  const photo =
    model.website.images.hero?.trim() ||
    model.website.images.about?.trim() ||
    model.website.images.worship?.trim() ||
    "";

  return (
    <div className="parish-theme parish-auth">
      <div className="parish-auth-scene" aria-hidden>
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            priority
            sizes="100vw"
            className="parish-auth-photo"
          />
        ) : null}
        <div className="parish-auth-scrim" />
      </div>
      <header className="parish-auth-top">
        <Link href={homeHref} className="parish-auth-brand">
          {logo ? (
            <span className="parish-auth-mark">
              <Image src={logo} alt="" fill className="object-contain" sizes="36px" />
            </span>
          ) : null}
          <span>{model.church.name}</span>
        </Link>
        <LocaleSwitcher className="parish-locale" menuClassName="parish-locale-menu" />
      </header>
      <section className="parish-auth-stage">
        <div className="parish-auth-card">{children}</div>
      </section>
    </div>
  );
}
