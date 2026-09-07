import Link from "next/link";

import {
  publicChurchesNav,
  publicCompanyNav,
  publicExploreNav,
  publicLegalNav,
} from "@/config/public-nav";
import { siteConfig } from "@/config/site";
import { buildCreateWorkspaceAuthHref } from "@/lib/auth/auth-paths";

import { PublicWordmark } from "./public-wordmark";

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${title}-${item.label}`}>
            <Link
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter() {
  const getStartedHref = buildCreateWorkspaceAuthHref("/signup");
  const churchesNav = publicChurchesNav.map((item) =>
    item.label === "Create a Church" || item.label === "Get Started"
      ? { ...item, href: getStartedHref }
      : item
  );

  return (
    <footer className="mt-auto border-t border-border/50 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <PublicWordmark />
            <p className="mt-3 text-sm font-medium text-foreground">
              Your church, connected.
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A modern digital platform helping churches and Christian
              communities worship, grow, connect, and serve together.
            </p>
          </div>

          <FooterColumn title="Explore" items={publicExploreNav} />
          <FooterColumn title={siteConfig.name} items={publicCompanyNav} />
          <FooterColumn title="For Churches" items={churchesNav} />
          <FooterColumn title="Legal" items={publicLegalNav} />
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Your church, connected.
          </p>
        </div>
      </div>
    </footer>
  );
}
