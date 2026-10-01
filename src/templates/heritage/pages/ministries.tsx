import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { tenantContentQuery } from "@/lib/content/content-scope";
import { listArticles } from "@/lib/postgres/features";
import { ArticlesTabContent } from "@/components/worship/articles-tab-content";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageContentFrame } from "@/templates/heritage/components/heritage-content-frame";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { heritageMemberHref, resolveHeritageImage } from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export function HeritageMinistriesPage({ model }: { model: ChurchWebsiteViewModel }) {
  if (model.ministries.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="heritage-eyebrow">{model.church.name}</p>
        <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">Ministries</h1>
        <p className="mt-4 text-[var(--heritage-muted)]">
          Ministry groups will appear here when they are created.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <p className="heritage-eyebrow">{model.church.name}</p>
      <h1 className="heritage-display mt-4 text-[length:var(--heritage-section)]">Ministries</h1>
      <div className="mt-12 space-y-16">
        {model.ministries.map((ministry, index) => (
          <article
            key={ministry.id}
            className="grid items-center gap-8 lg:grid-cols-2"
          >
            <div
              className={`heritage-media relative aspect-[4/3] overflow-hidden ${index % 2 === 1 ? "lg:order-2" : ""}`}
            >
              <HeritageImage
                src={resolveHeritageImage(
                  ministry.imageUrl || model.website.images.featuredMinistry,
                  HERITAGE_FALLBACK_IMAGES.featuredMinistry
                )}
                alt={ministry.name}
              />
            </div>
            <div>
              <h2 className="heritage-display text-[length:var(--heritage-section)]">{ministry.name}</h2>
              {ministry.description ?
                <p className="mt-4 text-[var(--heritage-muted)]">{ministry.description}</p>
              : null}
              <div className="mt-6">
                <HeritageButton href={heritageMemberHref(model, "groups")} variant="outline">
                  Join groups
                </HeritageButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function HeritageArticlesPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const articles = await listArticles(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow="Resources"
      title="Articles"
      description={`Articles and resources from ${model.church.name}.`}
    >
      <ArticlesTabContent
        initialArticles={articles}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/articles")}
        showCollectionHeader={false}
      />
    </HeritageContentFrame>
  );
}
