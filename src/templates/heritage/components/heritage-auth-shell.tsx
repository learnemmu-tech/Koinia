import Image from "next/image";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

import "@/templates/heritage/heritage.css";

const HERITAGE_AUTH_PHOTO = "/images/heritage-auth-sanctuary.jpg";

export async function HeritageAuthShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: React.ReactNode;
}) {
  const logo = model.website.images.logo || model.church.logoUrl || HERITAGE_FALLBACK_IMAGES.mark;
  const photo =
    model.website.images.hero?.trim() ||
    model.website.images.about?.trim() ||
    model.website.images.worship?.trim() ||
    HERITAGE_AUTH_PHOTO;

  return (
    <div className="heritage-theme heritage-auth-shell">
      <div className="heritage-auth-locale-bar">
        <LocaleSwitcher className="heritage-auth-locale" menuClassName="heritage-locale-menu" />
      </div>
      <div className="heritage-auth-body">
        <aside className="heritage-auth-visual">
          <div className="heritage-auth-media">
            <Image
              src={photo}
              alt=""
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="heritage-auth-photo"
            />
            <div className="heritage-auth-scrim" />
          </div>
          <Link href={churchWebsitePath(model.church.slug)} className="heritage-auth-brand">
            <span className="heritage-auth-mark">
              <Image src={logo} alt="" fill className="object-contain" sizes="36px" />
            </span>
            <span>{model.church.name}</span>
          </Link>
        </aside>

        <section className="heritage-auth-panel">
          <div className="heritage-auth-ornament" aria-hidden />
          <div className="heritage-auth-form-frame">{children}</div>
        </section>
      </div>
    </div>
  );
}
