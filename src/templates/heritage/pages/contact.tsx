import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritagePrayerForm } from "@/templates/heritage/components/heritage-prayer-form";
import { formatChurchAddress, heritageJoinCta } from "@/templates/heritage/lib";

export function HeritageContactPage({ model }: { model: ChurchWebsiteViewModel }) {
  const address = formatChurchAddress(model);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <p className="heritage-eyebrow">Visit</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        Contact & location
      </h1>
      <div className="heritage-rule mt-6" />
      <dl className="mt-10 space-y-6 text-[var(--heritage-muted)]">
        {address ? (
          <div>
            <dt className="heritage-eyebrow">Address</dt>
            <dd className="mt-2 text-lg text-[var(--heritage-text)]">{address}</dd>
          </div>
        ) : null}
        {model.church.email ? (
          <div>
            <dt className="heritage-eyebrow">Email</dt>
            <dd className="mt-2">
              <a href={`mailto:${model.church.email}`}>{model.church.email}</a>
            </dd>
          </div>
        ) : null}
        {model.church.phone ? (
          <div>
            <dt className="heritage-eyebrow">Phone</dt>
            <dd className="mt-2">
              <a href={`tel:${model.church.phone}`}>{model.church.phone}</a>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-10">
        <HeritageButton href={churchWebsitePath(model.church.slug)}>
          Back to home
        </HeritageButton>
      </div>
    </section>
  );
}

export function HeritagePrayerPage({ model }: { model: ChurchWebsiteViewModel }) {
  const joinCta = heritageJoinCta(model);
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="heritage-eyebrow">Prayer</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">
        Need prayer?
      </h1>
      <div className="heritage-rule mx-auto mt-6" />
      <p className="mt-6 text-[var(--heritage-muted)]">
        Share a prayer request with {model.church.name}. Choose whether it may
        appear on the members&apos; prayer wall after church leaders approve it.
        It is never published on the public website for visitors.
      </p>
      <HeritagePrayerForm model={model} />
      <p className="mt-8 text-sm text-[var(--heritage-muted)]">
        Looking for the full church home?{" "}
        <a className="underline" href={joinCta.href}>
          {joinCta.label}
        </a>
        .
      </p>
    </section>
  );
}
