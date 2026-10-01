import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { formatLongDate, heritageJoinHref } from "@/templates/heritage/lib";

export function SignatureHomePage({ model }: { model: ChurchWebsiteViewModel }) {
  const slug = model.church.slug;
  const hero = model.website.images.hero;
  const featured = model.sermons[0];

  return (
    <>
      <section className="relative overflow-hidden bg-card">
        {hero ?
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        : null}
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            {model.website.heroEyebrow || `Welcome to ${model.church.name}`}
          </p>
          <h1 className="font-heading mt-4 max-w-3xl whitespace-pre-line text-4xl font-semibold sm:text-6xl">
            {model.website.heroHeadline || model.church.name}
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            {model.website.heroSubheadline || model.church.description || model.church.welcomeMessage}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={heritageJoinHref(model, "/join")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Join our community
            </a>
            {isSectionVisible(model.website.visibility, "sermons") ?
              <a
                href={churchWebsitePath(slug, "/sermons")}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Watch sermons
              </a>
            : null}
          </div>
        </div>
      </section>
      {featured && isSectionVisible(model.website.visibility, "sermons") ?
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-heading text-3xl">Featured sermon</h2>
          <a href={churchWebsitePath(slug, `/sermons/${featured.id}`)} className="mt-6 block rounded-xl border border-border bg-card p-6">
            <h3 className="text-xl font-semibold">{featured.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {[featured.speaker, formatLongDate(featured.dateCreated)].filter(Boolean).join(" · ")}
            </p>
          </a>
        </section>
      : null}
      {model.events.length > 0 && isSectionVisible(model.website.visibility, "events") ?
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="font-heading text-3xl">Events</h2>
          <ul className="mt-6 space-y-4">
            {model.events.slice(0, 3).map((event) => (
              <li key={event.id} className="rounded-xl border border-border bg-card p-5">
                <a href={churchWebsitePath(slug, `/events/${event.id}`)}>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[formatLongDate(event.eventDate), event.eventTime, event.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      : null}
    </>
  );
}
