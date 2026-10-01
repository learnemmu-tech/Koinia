import { churchWebsitePath } from "@/lib/templates/paths";
import { getFooterNavItems, getPrimaryNavItems, getUtilityNavItems } from "@/lib/templates/nav";
import { configuredSocialLinks } from "@/lib/templates/social-links";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageSocialIcon } from "@/templates/heritage/components/heritage-social-icon";
import { formatChurchAddress, heritageJoinHref } from "@/templates/heritage/lib";

export function SignatureShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: React.ReactNode;
}) {
  const primary = getPrimaryNavItems(model);
  const utility = getUtilityNavItems(model);
  const footer = getFooterNavItems(model);
  const social = configuredSocialLinks(model.website.socialLinks);
  const memberHref = model.viewer.isAuthenticated
    ? model.viewer.isMember
      ? "/"
      : heritageJoinHref(model, "/join")
    : heritageJoinHref(model, "/signin");
  const memberLabel = model.viewer.isAuthenticated
    ? model.viewer.isMember
      ? "Member home"
      : "Join this church"
    : "Sign in";

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href={churchWebsitePath(model.church.slug)} className="font-heading text-lg font-semibold">
            {model.church.name}
          </a>
          <nav aria-label="Primary" className="ml-auto hidden items-center gap-5 md:flex">
            {[...primary, ...utility].map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
                {item.label}
              </a>
            ))}
            <a href={memberHref} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
              {memberLabel}
            </a>
          </nav>
        </div>
        <nav aria-label="Mobile" className="flex gap-3 overflow-x-auto px-4 pb-3 md:hidden">
          {[...primary, ...utility].map((item) => (
            <a key={item.href} href={item.href} className="whitespace-nowrap text-sm text-muted-foreground">
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-heading text-lg font-semibold">{model.church.name}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {model.church.description || model.website.metaDescription}
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            {footer.slice(0, 8).map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{formatChurchAddress(model)}</p>
            {model.church.email ? <p>{model.church.email}</p> : null}
            {model.church.phone ? <p>{model.church.phone}</p> : null}
            {social.length > 0 ?
              <ul className="flex gap-3 pt-2">
                {social.map((item) => (
                  <li key={item.platform}>
                    <a href={item.url} target="_blank" rel="noreferrer" aria-label={item.platform}>
                      <HeritageSocialIcon platform={item.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
