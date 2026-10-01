import Image from "next/image";
import Link from "next/link";

import { configuredSocialLinks } from "@/lib/templates/social-links";
import { isSectionVisible } from "@/lib/templates/visibility";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageSocialIcon } from "@/templates/heritage/components/heritage-social-icon";
import { getHeritageFooterNavLinks } from "@/templates/heritage/public-nav";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

const footerLinkClass =
  "inline-flex min-h-11 items-center rounded-sm px-1 text-[0.8125rem] font-medium text-[color-mix(in_srgb,var(--heritage-primary-foreground)_86%,transparent)] transition-colors hover:text-[var(--heritage-primary-foreground)]";

export function HeritageFooter({ model }: { model: ChurchWebsiteViewModel }) {
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;
  const social = configuredSocialLinks(model.website.socialLinks);
  const year = new Date().getFullYear();
  const links = getHeritageFooterNavLinks(model);

  return (
    <footer className="heritage-on-dark bg-[var(--heritage-secondary)] text-[var(--heritage-primary-foreground)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href={churchWebsitePath(model.church.slug)}
          className="inline-flex items-center gap-3 rounded-sm"
        >
          <span className="relative size-10 shrink-0 overflow-hidden">
            <Image src={logo} alt="" fill className="object-contain" sizes="40px" />
          </span>
          <span>
            <span className="heritage-display block text-[1.15rem] leading-none">
              {model.church.name}
            </span>
            <span className="mt-1 block text-[0.625rem] font-medium tracking-[0.1em] uppercase text-[color-mix(in_srgb,var(--heritage-primary-foreground)_62%,transparent)]">
              Faith · Community · Service
            </span>
          </span>
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {links.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link href={item.href} className={footerLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {social.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {social.map((item) => (
              <li key={item.platform}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full text-[var(--heritage-primary-foreground)] transition-colors hover:text-[var(--heritage-accent)]"
                  aria-label={`${item.platform} (opens in a new tab)`}
                >
                  <HeritageSocialIcon platform={item.platform} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--heritage-primary-foreground)_12%,transparent)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[color-mix(in_srgb,var(--heritage-primary-foreground)_68%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {model.church.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap gap-x-6">
            <Link href="/privacy" className="inline-block rounded-sm py-1.5 hover:text-[var(--heritage-primary-foreground)]">
              Privacy
            </Link>
            <Link href="/terms" className="inline-block rounded-sm py-1.5 hover:text-[var(--heritage-primary-foreground)]">
              Terms
            </Link>
            {isSectionVisible(model.website.visibility, "contact") ? (
              <Link
                href={churchWebsitePath(model.church.slug, "/contact")}
                className="inline-block rounded-sm py-1.5 hover:text-[var(--heritage-primary-foreground)]"
              >
                Contact
              </Link>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
