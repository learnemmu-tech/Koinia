import { getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";

import { ArticleDetailView } from "@/components/articles/article-detail-view";
import { DonationsListClient } from "@/components/donations/donations-list-client";
import { DonationCampaignDetailClient } from "@/components/donations/donation-campaign-detail-client";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { EventsListClient } from "@/components/events/events-list-client";
import { SermonDetailView } from "@/components/sermons/sermon-detail-view";
import { ParishVideosTabs } from "@/templates/parish/components/parish-videos-tabs";
import { ArticlesTabContent } from "@/components/worship/articles-tab-content";
import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { getArticleNeighbors, getRelatedArticles } from "@/lib/article-utils";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import { tenantContentQuery } from "@/lib/content/content-scope";
import {
  defaultAboutBeliefs,
  defaultAboutValues,
  resolveAboutHeadline,
  resolveAboutIntro,
} from "@/lib/templates/about-content";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { listArticles, listDonationCampaigns, listSermons } from "@/lib/postgres/features";
import { listPublishedChurchVideos } from "@/lib/postgres/church-videos";
import { userCanAccessChurchContent, userCanManageChurch } from "@/lib/postgres/session";
import { listPendingReviewShorts } from "@/lib/postgres/shorts";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import { HeritagePrayerForm } from "@/templates/heritage/components/heritage-prayer-form";
import { formatChurchAddress, heritageJoinChurchHref, heritageLoginHref } from "@/templates/heritage/lib";
import { ParishButton } from "@/templates/parish/components/parish-button";
import { ParishContactForm } from "@/templates/parish/components/parish-contact-form";
import { ParishContentFrame, ParishDetailFrame } from "@/templates/parish/components/parish-frame";

function scope(model: ChurchWebsiteViewModel) {
  return tenantContentQuery({
    organizationId: model.church.organizationId,
    churchId: model.church.id,
  });
}

export async function ParishAboutPage({ model }: { model: ChurchWebsiteViewModel }) {
  const headline = resolveAboutHeadline(model.website.aboutHeadline, model.church.name);
  const intro = resolveAboutIntro(
    model.website.aboutIntro,
    model.church.description,
    model.church.welcomeMessage,
    model.church.name
  );
  const values = model.website.aboutValues.length ? model.website.aboutValues : defaultAboutValues();
  const beliefs = model.website.aboutBeliefs.length
    ? model.website.aboutBeliefs
    : defaultAboutBeliefs(model.church.name);
  return (
    <ParishContentFrame churchName={model.church.name} eyebrow="About" title={headline} description={intro}>
      {model.website.aboutMission ? <p className="parish-muted">{model.website.aboutMission}</p> : null}
      <div className="parish-card-grid cols-2 mt-8">
        {values.map((item) => (
          <article key={item.title} className="parish-card">
            <h2 className="parish-display text-3xl">{item.title}</h2>
            <p className="parish-muted mt-2">{item.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 space-y-4">
        {beliefs.map((item) => (
          <article key={item.title}>
            <h3 className="parish-display text-2xl">{item.title}</h3>
            <p className="parish-muted mt-1">{item.body}</p>
          </article>
        ))}
      </div>
    </ParishContentFrame>
  );
}

export async function ParishSermonsPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.pages");
  const sermons = await listSermons(scope(model), { publishedOnly: true, limit: 80 });
  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow={t("messages")}
      title={t("sermons")}
      description={t("sermonsDescription", { name: model.church.name })}
    >
      <SermonsTabContent
        initialSermons={sermons}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/sermons")}
        showCollectionHeader={false}
      />
    </ParishContentFrame>
  );
}

export function ParishSermonDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseSermon;
}) {
  return (
    <ParishDetailFrame>
      <SermonDetailView sermon={item} hrefPrefix={churchWebsitePath(model.church.slug, "/sermons")} />
    </ParishDetailFrame>
  );
}

export async function ParishEventsPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.events");
  const { upcoming, past } = await getPublishedEventsGroupedCached(scope(model));
  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow={t("eyebrow")}
      title={t("pageTitle")}
      description={t("pageDescription", { name: model.church.name })}
    >
      <EventsListClient
        initialUpcoming={upcoming}
        initialPast={past}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/events")}
      />
    </ParishContentFrame>
  );
}

export function ParishEventDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseEvent;
}) {
  return (
    <ParishDetailFrame>
      <EventDetailClient
        eventId={item.id}
        initialEvent={item}
        listHref={churchWebsitePath(model.church.slug, "/events")}
      />
    </ParishDetailFrame>
  );
}

export async function ParishMinistriesPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.ministries");
  return (
    <ParishContentFrame churchName={model.church.name} eyebrow="Groups" title={t("pageTitle")}>
      {model.ministries.length === 0 ? (
        <p className="parish-muted">{t("empty")}</p>
      ) : (
        <div className="space-y-8">
          {model.ministries.map((ministry) => (
            <article key={ministry.id} className="parish-card">
              <h2 className="parish-display text-3xl">{ministry.name}</h2>
              <p className="parish-muted mt-2">{ministry.description}</p>
            </article>
          ))}
        </div>
      )}
    </ParishContentFrame>
  );
}

export async function ParishArticlesPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.pages");
  const articles = await listArticles(scope(model), { publishedOnly: true, limit: 80 });
  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow="Stories"
      title={t("articles")}
      description={t("articlesDescription", { name: model.church.name })}
    >
      <ArticlesTabContent
        initialArticles={articles}
        isPlatformPublic
        hrefPrefix={churchWebsitePath(model.church.slug, "/articles")}
        showCollectionHeader={false}
      />
    </ParishContentFrame>
  );
}

export async function ParishArticleDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseArticle;
}) {
  const published = await listArticles(scope(model), { publishedOnly: true, limit: 80 });
  const { previous, next } = getArticleNeighbors(published, item.id);
  return (
    <ParishDetailFrame>
      <ArticleDetailView
        article={item}
        relatedArticles={getRelatedArticles(published, item.id, 3)}
        previousArticle={previous}
        nextArticle={next}
        hrefPrefix={churchWebsitePath(model.church.slug, "/articles")}
      />
    </ParishDetailFrame>
  );
}

export async function ParishVideosPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.pages");
  const session = await auth();
  const email = session.sessionClaims?.email as string | undefined;
  const [videos, shorts, canManage, canAccess, pending] = await Promise.all([
    listPublishedChurchVideos({ query: scope(model), limit: 80 }),
    getPublishedShortsForViewer(scope(model), "church", {
      clerkId: session.userId,
      email,
    }),
    session.userId
      ? userCanManageChurch(session.userId, email, model.church.id)
      : Promise.resolve(false),
    session.userId
      ? userCanAccessChurchContent(session.userId, email, model.church.id)
      : Promise.resolve(false),
    session.userId
      ? listPendingReviewShorts({
          clerkId: session.userId,
          email,
          churchId: model.church.id,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <ParishContentFrame
      churchName={model.church.name}
      eyebrow={t("watch")}
      title={t("videos")}
      description={t("videosDescription", { name: model.church.name })}
    >
      <ParishVideosTabs
        initialVideos={videos}
        initialShorts={shorts}
        churchName={model.church.name}
        canManageVideos={canManage}
        canManageShorts={canManage}
        canSubmitShorts={canAccess && !canManage}
        churchId={model.church.id}
        pendingShorts={canManage ? pending : []}
      />
    </ParishContentFrame>
  );
}

export async function ParishGivePage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.giving");
  const campaigns = await listDonationCampaigns(scope(model), { publishedOnly: true, limit: 80 });
  return (
    <ParishContentFrame churchName={model.church.name} eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <DonationsListClient
        initialCampaigns={campaigns}
        clientSync={false}
        hrefPrefix={churchWebsitePath(model.church.slug, "/give")}
      />
    </ParishContentFrame>
  );
}

export function ParishGiveDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseDonationCampaign;
}) {
  return (
    <ParishDetailFrame>
      <DonationCampaignDetailClient
        campaignId={item.id}
        initialCampaign={item}
        listHref={churchWebsitePath(model.church.slug, "/give")}
        clientSync={false}
      />
    </ParishDetailFrame>
  );
}

export async function ParishContactPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.contact");
  const address = formatChurchAddress(model);
  return (
    <ParishContentFrame churchName={model.church.name} eyebrow={t("eyebrow")} title={t("title")}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <dl className="space-y-4">
        {address ? (
          <div>
            <dt className="parish-eyebrow">{t("address")}</dt>
            <dd className="mt-1">{address}</dd>
          </div>
        ) : null}
        {model.church.email ? (
          <div>
            <dt className="parish-eyebrow">{t("email")}</dt>
            <dd className="mt-1">
              <a href={`mailto:${model.church.email}`}>{model.church.email}</a>
            </dd>
          </div>
        ) : null}
        {model.church.phone ? (
          <div>
            <dt className="parish-eyebrow">{t("phone")}</dt>
            <dd className="mt-1">
              <a href={`tel:${model.church.phone}`}>{model.church.phone}</a>
            </dd>
          </div>
        ) : null}
      </dl>
      <ParishContactForm churchSlug={model.church.slug} />
      </div>
    </ParishContentFrame>
  );
}

export async function ParishPrayerPage({ model }: { model: ChurchWebsiteViewModel }) {
  const t = await getTranslations("heritage.prayer");
  return (
    <section className="parish-page max-w-2xl">
      <p className="parish-eyebrow">{t("eyebrow")}</p>
      <h1 className="parish-display mt-3 text-5xl text-[var(--parish-forest)]">{t("need")}</h1>
      <p className="parish-muted mt-4">{t("intro", { name: model.church.name })}</p>
      <HeritagePrayerForm model={model} />
    </section>
  );
}

export async function ParishMemberGate({
  model,
  featureLabel,
}: {
  model: ChurchWebsiteViewModel;
  featureLabel: string;
}) {
  const t = await getTranslations("heritage.gate");
  return (
    <section className="parish-page max-w-xl text-center">
      <p className="parish-eyebrow">{t("eyebrow")}</p>
      <h1 className="parish-display mt-3 text-5xl text-[var(--parish-forest)]">{t("title")}</h1>
      <p className="parish-muted mt-4">{t("body", { feature: featureLabel, name: model.church.name })}</p>
      <div className="mt-6 flex justify-center gap-3">
        <ParishButton href={heritageJoinChurchHref(model)}>Join</ParishButton>
        {!model.viewer.isAuthenticated ? (
          <ParishButton href={heritageLoginHref(model, churchWebsitePath(model.church.slug))} variant="gold">
            Sign in
          </ParishButton>
        ) : null}
      </div>
    </section>
  );
}
