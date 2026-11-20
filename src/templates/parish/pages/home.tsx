import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Music, Play } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { ParishButton } from "@/templates/parish/components/parish-button";
import { ParishCountdown } from "@/templates/parish/components/parish-countdown";
import {
  formatChurchAddress,
  upcomingChurchEvents,
} from "@/templates/heritage/lib";
import { PARISH_DEFAULTS } from "@/templates/parish/defaults";
import { parishHeroImage } from "@/templates/parish/theme";

export async function ParishHomePage({ model }: { model: ChurchWebsiteViewModel }) {
  const slug = model.church.slug;
  const path = (suffix = "") => churchWebsitePath(slug, suffix);
  const heroImage = parishHeroImage(model.website.images.hero, model.church.bannerUrl);
  const historyImage = model.website.images.about || PARISH_DEFAULTS.about;
  const t = await getTranslations("parish.home");
  const tNav = await getTranslations("heritage.nav");
  const headline = model.website.heroHeadline || model.church.name;
  const tagline =
    model.website.heroSubheadline || t("fallbackTagline");
  const heroDescription =
    model.church.welcomeMessage || t("fallbackHero");
  const intro =
    model.website.aboutIntro ||
    model.church.description ||
    t("fallbackIntro", { name: model.church.name });
  const history =
    model.website.aboutMission ||
    model.website.aboutCommunity ||
    t("fallbackHistory", { name: model.church.name });
  const quote = model.website.scriptureText || t("fallbackQuote");
  const quoteRef = model.website.scriptureReference || t("fallbackQuoteRef");
  const address = formatChurchAddress(model);
  const events = upcomingChurchEvents(model.events, 3);
  const nextEvent = events[0];
  const sermons = model.sermons.slice(0, 4);
  const articles = model.articles.slice(0, 3);
  return (
    <>
      <section className="parish-hero">
        <div className="parish-hero-media">
          <Image src={heroImage} alt="" fill priority className="object-cover object-center" sizes="100vw" />
          <div className="parish-hero-scrim" />
        </div>
        <div className="parish-hero-copy parish-hero-copy-center">
          <h1 className="parish-display">{headline}</h1>
          <p className="parish-hero-tagline">{tagline}</p>
          <p>{heroDescription}</p>
          <div className="parish-actions parish-actions-center">
            <ParishButton href={path("/contact")} variant="light">{t("requestHelp")}</ParishButton>
            <ParishButton href={path("/give")} variant="gold">{t("donateNow")}</ParishButton>
          </div>
        </div>
      </section>

      {nextEvent ? (
        <section className="parish-service-strip">
          <div>
            <p className="parish-eyebrow">{t("nextService")}</p>
            <p className="parish-display text-2xl">{nextEvent.title}</p>
            <p className="text-sm">
              {[nextEvent.eventDate, nextEvent.eventTime, nextEvent.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <ParishCountdown isoDate={nextEvent.eventDate} time={nextEvent.eventTime} />
          <ParishButton href={path(`/events/${nextEvent.id}`)} variant="gold">{t("details")}</ParishButton>
        </section>
      ) : null}

      <section className="parish-section">
        <p className="parish-lead">{intro}</p>
      </section>

      <section className="parish-section parish-split">
        <div>
          <p className="parish-eyebrow">{t("aboutUs")}</p>
          <h2 className="parish-display mt-2 text-[var(--parish-forest)]">
            {model.website.aboutHeadline || t("historyTitle")}
          </h2>
          <p className="parish-muted mt-4">{history}</p>
          <div className="mt-6">
            <ParishButton href={path("/about")}>{t("moreAbout")}</ParishButton>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md">
          <Image src={historyImage} alt="" fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
        </div>
      </section>

      <section className="parish-section parish-section-compact">
        <div className="parish-watch">
          <div className="parish-watch-intro">
            <p className="parish-eyebrow">{t("media")}</p>
            <h2 className="parish-display mt-2 text-[var(--parish-forest)]">{t("watchListen")}</h2>
            <p className="parish-muted mt-3 max-w-sm">
              {t("mediaLede")}
            </p>
            <ParishButton href={path("/videos")} className="parish-watch-cta mt-5">
              {t("exploreMedia")} →
            </ParishButton>
          </div>
          <div className="parish-watch-cards">
            {[
              {
                href: "/videos",
                title: tNav("videos"),
                action: t("watchVideos"),
                image: model.videos.find((video) => video.thumbnailUrl)?.thumbnailUrl || PARISH_DEFAULTS.sermons[0],
                Icon: Clapperboard,
              },
              {
                href: "/songs",
                title: tNav("songs"),
                action: t("listenSongs"),
                image: PARISH_DEFAULTS.services[1],
                Icon: Music,
              },
            ].map((card) => (
              <Link key={card.title} href={path(card.href)} className="parish-watch-card">
                <span className="parish-watch-thumb">
                  <Image src={card.image!} alt="" fill className="object-cover" sizes="(min-width: 768px) 28vw, 100vw" />
                  <span className="parish-watch-play" aria-hidden>
                    <Play className="size-4 fill-current" />
                  </span>
                </span>
                <span className="parish-watch-meta">
                  <span className="parish-watch-title">
                    <card.Icon className="size-4" aria-hidden />
                    {card.title}
                  </span>
                  <span className="parish-watch-link">{card.action} →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isSectionVisible(model.website.visibility, "events") ? (
        <section className="parish-section">
          <div className="parish-center">
            <p className="parish-eyebrow">{t("joinUs")}</p>
            <h2 className="parish-display text-[var(--parish-forest)]">{t("eventsTitle")}</h2>
            <p className="parish-muted mx-auto mt-3 max-w-2xl">
              {t("eventsLede", { name: model.church.name })}
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {events.length === 0
              ? [t("sampleEvent1"), t("sampleEvent2"), t("sampleEvent3")].map((title, index) => (
                  <Link key={title} href={path("/events")} className="parish-event-row">
                    <Image src={PARISH_DEFAULTS.events[index]!} alt="" width={220} height={140} className="h-28 w-full object-cover sm:h-full sm:w-40" />
                    <div>
                      <p className="parish-eyebrow">{t("sample")}</p>
                      <h3 className="parish-display mt-1 text-2xl">{title}</h3>
                      <p className="parish-muted mt-1 text-sm">{t("sampleEventNote", { name: model.church.name })}</p>
                    </div>
                    <span className="parish-eyebrow px-4">{t("viewEvents")}</span>
                  </Link>
                ))
              : events.map((event, index) => (
                  <Link key={event.id} href={path(`/events/${event.id}`)} className="parish-event-row">
                    <Image
                      src={event.bannerImage || PARISH_DEFAULTS.events[index % PARISH_DEFAULTS.events.length]!}
                      alt=""
                      width={220}
                      height={140}
                      className="h-28 w-full object-cover sm:h-full sm:w-40"
                    />
                    <div>
                      <p className="parish-eyebrow">{[event.eventDate, event.eventTime].filter(Boolean).join(" · ") || t("upcoming")}</p>
                      <h3 className="parish-display mt-1 text-2xl">{event.title}</h3>
                      <p className="parish-muted mt-1 line-clamp-2 text-sm">{event.description}</p>
                    </div>
                    <span className="parish-eyebrow px-4">{t("viewDetails")}</span>
                  </Link>
                ))}
          </div>
          <div className="mt-6 text-center">
            <ParishButton href={path("/events")}>{t("viewAllEvents")}</ParishButton>
          </div>
        </section>
      ) : null}

      <section className="parish-band">
        <div className="parish-section parish-section-compact">
          <h2 className="parish-display text-center">{t("resourcesTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#efe6d6]">
            {t("resourcesLede")}
          </p>
          <div className="parish-card-grid cols-4 mt-6">
            {[
              { href: "/community", title: tNav("community"), description: t("communityCopy"), action: t("exploreCommunity"), image: PARISH_DEFAULTS.gallery[0] },
              { href: "/books", title: tNav("books"), description: t("booksCopy"), action: t("browseBooks"), image: PARISH_DEFAULTS.stories[2] },
              { href: "/shepherd", title: tNav("shepherd"), description: t("shepherdCopy"), action: t("openShepherd"), image: PARISH_DEFAULTS.quote },
              { href: "/prayer", title: tNav("prayerRequests"), description: t("prayerCopy"), action: t("submitPrayer"), image: PARISH_DEFAULTS.ministries[3] },
            ].map((card) => (
              <Link key={card.title} href={path(card.href)} className="parish-photo-card parish-resource-card">
                <Image src={card.image!} alt="" width={480} height={320} className="aspect-[4/3] w-full object-cover" />
                <h3>{card.title}</h3>
                <p className="parish-muted text-sm">{card.description}</p>
                <span className="parish-card-action">{card.action} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isSectionVisible(model.website.visibility, "sermons") ? (
        <section className="parish-section parish-center">
          <p className="parish-eyebrow">{t("latestSermons")}</p>
          <h2 className="parish-display text-[var(--parish-forest)]">{t("onlineSermons")}</h2>
          <p className="parish-muted mx-auto mt-3 max-w-2xl">
            {t("sermonsLede", { name: model.church.name })}
          </p>
          <div className="parish-card-grid cols-4 mt-8 text-left">
            {(sermons.length > 0 ? sermons : [0, 1, 2, 3].map((index) => ({
              id: `sample-sermon-${index}`,
              title: [t("sampleSermon1"), t("sampleSermon2"), t("sampleSermon3"), t("sampleSermon4")][index]!,
              speaker: t("sample"),
              coverImage: PARISH_DEFAULTS.sermons[index],
              sample: true,
            }))).map((sermon, index) => (
                <Link
                  key={sermon.id}
                  href={"sample" in sermon ? path("/sermons") : path(`/sermons/${sermon.id}`)}
                  className="parish-photo-card"
                >
                  <Image
                    src={sermon.coverImage || PARISH_DEFAULTS.sermons[index % 4]!}
                    alt=""
                    width={480}
                    height={320}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {"sample" in sermon ? <p className="parish-eyebrow px-4 pt-3">{t("sample")}</p> : null}
                  <h3>{sermon.title}</h3>
                  {sermon.speaker ? <p className="parish-muted px-4 pb-3 text-sm">{sermon.speaker}</p> : null}
                </Link>
              ))}
          </div>
          <div className="mt-6">
            <ParishButton href={path("/sermons")}>{t("viewAllSermons")}</ParishButton>
          </div>
        </section>
      ) : null}

      <section className="parish-quote">
        <div className="relative min-h-72">
          <Image src={PARISH_DEFAULTS.quote} alt="" fill className="object-cover" sizes="50vw" />
        </div>
        <blockquote>
          <p className="parish-display text-3xl sm:text-4xl">{quote}</p>
          <footer className="parish-eyebrow mt-4">{quoteRef}</footer>
        </blockquote>
      </section>

      {isSectionVisible(model.website.visibility, "articles") ? (
        <section className="parish-section parish-center">
          <p className="parish-eyebrow">{t("latestStories")}</p>
          <h2 className="parish-display text-[var(--parish-forest)]">{t("storiesTitle")}</h2>
          <p className="parish-muted mx-auto mt-3 max-w-2xl">{t("storiesLede")}</p>
          <div className="parish-card-grid cols-3 mt-8 text-left">
            {(articles.length > 0 ? articles : [0, 1, 2].map((index) => ({
              id: `sample-story-${index}`,
              title: [t("sampleStory1"), t("sampleStory2"), t("sampleStory3")][index]!,
              coverImage: PARISH_DEFAULTS.stories[index],
              category: t("sample"),
              dateCreated: 0,
              sample: true,
            }))).map((article) => (
                <Link
                  key={article.id}
                  href={"sample" in article ? path("/articles") : path(`/articles/${article.id}`)}
                  className="parish-photo-card"
                >
                  <Image
                    src={article.coverImage || PARISH_DEFAULTS.stories[0]!}
                    alt=""
                    width={480}
                    height={300}
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <p className="parish-eyebrow px-4 pt-3">
                    {article.category}
                    {article.dateCreated ? ` · ${new Date(article.dateCreated).toLocaleDateString()}` : ""}
                  </p>
                  <h3>{article.title}</h3>
                  <span className="parish-eyebrow px-4 pb-3">{t("readMore")}</span>
                </Link>
              ))}
          </div>
          <div className="mt-6">
            <ParishButton href={path("/articles")}>{t("viewAllArticles")}</ParishButton>
          </div>
        </section>
      ) : null}

      <section className="parish-section parish-center">
        <h2 className="parish-display text-[var(--parish-forest)]">{t("hearFromYou")}</h2>
        <p className="parish-muted mx-auto mt-3 max-w-xl">
          {address || t("contactFallback", { name: model.church.name })}
        </p>
        {model.church.email ? <p className="mt-2">{model.church.email}</p> : null}
        {model.church.phone ? <p>{model.church.phone}</p> : null}
        <div className="mt-6 flex justify-center gap-3">
          <ParishButton href={path("/about")}>{t("visitUs")}</ParishButton>
          <ParishButton href={path("/contact")} variant="gold">{t("contactUs")}</ParishButton>
        </div>
      </section>

      <div className="parish-strip">
        {PARISH_DEFAULTS.gallery.map((src) => (
          <Image key={src} src={src} alt="" width={480} height={280} className="h-36 w-full object-cover sm:h-44" />
        ))}
      </div>
    </>
  );
}
