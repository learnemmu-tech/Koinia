import Image from "next/image";
import Link from "next/link";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { ParishNav } from "@/templates/parish/components/parish-nav";
import { heritageHeaderAuth } from "@/templates/heritage/lib";
import {
  getParishPageLinks,
  getParishPrimaryNavLinks,
} from "@/templates/parish/public-nav";

export function ParishHeader({ model }: { model: ChurchWebsiteViewModel }) {
  const homeHref = churchWebsitePath(model.church.slug);
  const auth = heritageHeaderAuth(model);
  const logo = model.website.images.logo || model.church.logoUrl;

  return (
    <header className="parish-header">
      <div className="parish-header-inner">
        <Link href={homeHref} className="parish-brand" aria-label={model.church.name}>
          {logo ? (
            <span className="parish-brand-mark">
              <Image src={logo} alt="" fill className="object-contain" sizes="40px" />
            </span>
          ) : null}
          <span className="parish-brand-name">{model.church.name}</span>
        </Link>
        <ParishNav
          homeHref={homeHref}
          primary={getParishPrimaryNavLinks(model)}
          pages={getParishPageLinks(model)}
          isAuthenticated={auth.isAuthenticated}
          joinHref={auth.joinHref}
          signInHref={auth.signInHref}
        />
      </div>
    </header>
  );
}
