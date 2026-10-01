import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { heritageJoinChurchHref, heritageLoginHref } from "@/templates/heritage/lib";

export function HeritageMemberGate({
  model,
  featureLabel,
}: {
  model: ChurchWebsiteViewModel;
  featureLabel: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="heritage-eyebrow">Members</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        This content is available to church members.
      </h1>
      <p className="mt-5 text-[var(--heritage-muted)]">
        {featureLabel} is part of {model.church.name}&apos;s member community.
        Join the church to request access.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <HeritageButton href={heritageJoinChurchHref(model)} arrow>
          Join Our Church
        </HeritageButton>
        {!model.viewer.isAuthenticated ? (
          <HeritageButton
            href={heritageLoginHref(model, churchWebsitePath(model.church.slug))}
            variant="outline"
          >
            Sign in
          </HeritageButton>
        ) : null}
      </div>
      <p className="mt-8">
        <HeritageButton href={churchWebsitePath(model.church.slug)} variant="ghost">
          Return to the public website
        </HeritageButton>
      </p>
    </section>
  );
}
