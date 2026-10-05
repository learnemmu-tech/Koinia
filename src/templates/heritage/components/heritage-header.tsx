import Image from "next/image";
import Link from "next/link";

import { getTranslations } from "next-intl/server";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageHeaderFrame } from "@/templates/heritage/components/heritage-header-frame";
import { HeritageNav } from "@/templates/heritage/components/heritage-nav";
import { heritageHeaderAuth } from "@/templates/heritage/lib";
import {
  getHeritagePrimaryNavLinks,
  getHeritagePublicNavGroups,
} from "@/templates/heritage/public-nav";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export async function HeritageHeader({ model }: { model: ChurchWebsiteViewModel }) {
  const tNav = await getTranslations("heritage.nav");
  const tCommon = await getTranslations("heritage.common");
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;
  const homeHref = churchWebsitePath(model.church.slug);
  const auth = heritageHeaderAuth(model);

  return (
    <HeritageHeaderFrame homeHref={homeHref}>
      <div className="heritage-header-bar relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="heritage-brand rounded-sm"
          aria-label={tNav("homeAria", { name: model.church.name })}
        >
          <span className="heritage-brand-mark">
            <Image
              src={logo}
              alt=""
              fill
              className="object-contain object-center"
              sizes="48px"
            />
          </span>
          <span className="heritage-brand-name">{model.church.name}</span>
        </Link>
        <HeritageNav
          homeHref={homeHref}
          churchId={model.church.id}
          churchSlug={model.church.slug}
          primary={getHeritagePrimaryNavLinks(model)}
          groups={getHeritagePublicNavGroups(model)}
          isAuthenticated={auth.isAuthenticated}
          isMember={auth.isMember}
          joinHref={auth.joinHref}
          joinLabel={tCommon("joinUs")}
          signInHref={auth.signInHref}
          signInLabel={tCommon("signIn")}
        />
      </div>
    </HeritageHeaderFrame>
  );
}
