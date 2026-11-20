import { getTranslations } from "next-intl/server";

import { DonateForm } from "@/components/donations/donate-form";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel, TemplatePages } from "@/lib/templates/types";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import { SignatureShell } from "@/templates/signature/components/signature-shell";
import { SignatureHomePage } from "@/templates/signature/pages/home";
import { formatLongDate, heritageJoinHref } from "@/templates/heritage/lib";

function SimplePage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl">{title}</h1>
      <div className="mt-8">{children}</div>
    </section>
  );
}

async function MemberGate({
  model,
  featureLabel,
}: {
  model: ChurchWebsiteViewModel;
  featureLabel: string;
}) {
  const t = await getTranslations("signature");
  const tCommon = await getTranslations("heritage.common");
  return (
    <SimplePage title={t("membersOnly")}>
      <p className="text-muted-foreground">
        {t("membersOnlyBody", { feature: featureLabel })}
      </p>
      <div className="mt-6 flex gap-3">
        <a className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href={heritageJoinHref(model, "/signin")}>
          {tCommon("signIn")}
        </a>
        <a className="rounded-md border border-border px-4 py-2" href={heritageJoinHref(model, "/join")}>
          {t("joinChurch")}
        </a>
      </div>
    </SimplePage>
  );
}

export const signaturePages: TemplatePages = {
  Shell: SignatureShell,
  Home: SignatureHomePage,
  About: async ({ model }) => {
    const t = await getTranslations("signature");
    return (
    <SimplePage title={t("aboutTitle", { name: model.church.name })}>
      <p className="text-muted-foreground">
        {model.church.description || model.church.welcomeMessage}
      </p>
    </SimplePage>
    );
  },
  Sermons: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("sermons")}>
      <ul className="space-y-4">
        {model.sermons.map((sermon) => (
          <li key={sermon.id}>
            <a href={churchWebsitePath(model.church.slug, `/sermons/${sermon.id}`)}>
              {sermon.title}
            </a>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  SermonDetail: async ({ model, item }: { model: ChurchWebsiteViewModel; item: FirebaseSermon }) => {
    const t = await getTranslations("signature");
    return (
    <SimplePage title={item.title}>
      <p className="text-sm text-muted-foreground">
        {[item.speaker, formatLongDate(item.dateCreated)].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-4">{item.shortDescription}</p>
      <a className="mt-6 inline-block text-sm" href={churchWebsitePath(model.church.slug, "/sermons")}>
        {t("allSermons")}
      </a>
    </SimplePage>
    );
  },
  Events: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("events")}>
      <ul className="space-y-4">
        {model.events.map((event) => (
          <li key={event.id}>
            <a href={churchWebsitePath(model.church.slug, `/events/${event.id}`)}>{event.title}</a>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  EventDetail: ({ item }: { model: ChurchWebsiteViewModel; item: FirebaseEvent }) => (
    <SimplePage title={item.title}>
      <p>{[formatLongDate(item.eventDate), item.eventTime, item.location].filter(Boolean).join(" · ")}</p>
      <p className="mt-4">{item.description}</p>
    </SimplePage>
  ),
  Ministries: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("ministries")}>
      <ul className="space-y-4">
        {model.ministries.map((ministry) => (
          <li key={ministry.id}>
            <h2 className="font-semibold">{ministry.name}</h2>
            <p className="text-sm text-muted-foreground">{ministry.description}</p>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  Articles: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("articles")}>
      <ul className="space-y-4">
        {model.articles.map((article) => (
          <li key={article.id}>
            <a href={churchWebsitePath(model.church.slug, `/articles/${article.id}`)}>
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  ArticleDetail: ({ item }: { model: ChurchWebsiteViewModel; item: FirebaseArticle }) => (
    <SimplePage title={item.title}>
      <p>{item.shortDescription}</p>
      {item.content ? <p className="mt-4 whitespace-pre-wrap">{item.content}</p> : null}
    </SimplePage>
  ),
  Videos: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("videos")}>
      <ul className="space-y-4">
        {model.videos.map((video) => (
          <li key={video.id}>
            <a href={video.externalUrl} target="_blank" rel="noreferrer">
              {video.title}
            </a>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  Give: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("give")}>
      <ul className="space-y-4">
        {model.campaigns.map((campaign) => (
          <li key={campaign.id}>
            <a href={churchWebsitePath(model.church.slug, `/give/${campaign.id}`)}>
              {campaign.title}
            </a>
          </li>
        ))}
      </ul>
    </SimplePage>
    );
  },
  GiveDetail: ({
    item,
  }: {
    model: ChurchWebsiteViewModel;
    item: FirebaseDonationCampaign;
  }) => (
    <SimplePage title={item.title}>
      <DonateForm campaign={item} />
    </SimplePage>
  ),
  Contact: async ({ model }) => {
    const t = await getTranslations("heritage.nav");
    return (
    <SimplePage title={t("contact")}>
      <p>{model.church.email}</p>
      <p>{model.church.phone}</p>
    </SimplePage>
    );
  },
  Prayer: async ({ model }) => {
    const t = await getTranslations("signature");
    const tPrayer = await getTranslations("heritage.prayer");
    return (
    <SimplePage title={tPrayer("need")}>
      <p className="text-muted-foreground">
        {t("prayerPrivate")}
      </p>
      <a
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        href={model.viewer.isMember ? "/prayer-requests" : churchWebsitePath(model.church.slug, "/members")}
      >
        {t("sharePrayer")}
      </a>
    </SimplePage>
    );
  },
  MemberGate,
};
