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
  const headline = model.website.heroHeadline || `Welcome to ${model.church.name}`;
  const tagline =
    model.website.heroSubheadline ||
    "A place of prayer, tradition, and fellowship in Christ.";
  const heroDescription =
    model.church.welcomeMessage ||
    "We invite you to worship with us and take part in the life of our parish community.";
  const intro =
    model.website.aboutIntro ||
    model.church.description ||
    `At ${model.church.name}, faith and tradition come together in worship, prayer, and community. We invite you to join us and become part of our parish family.`;
  const history =
    model.website.aboutMission ||
    model.website.aboutCommunity ||
    `${model.church.name} gathers for worship, teaching, and the life of the parish.`;
  const quote =
    model.website.scriptureText ||
    "How good and pleasant it is when God's people live together in unity!";
  const quoteRef = model.website.scriptureReference || "Psalm 133:1";
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
            <ParishButton href={path("/contact")} variant="light">Request help</ParishButton>
            <ParishButton href={path("/give")} variant="gold">Donate now</ParishButton>
          </div>
        </div>
      </section>

      {nextEvent ? (
        <section className="parish-service-strip">
          <div>
            <p className="parish-eyebrow">Next service</p>
            <p className="parish-display text-2xl">{nextEvent.title}</p>
            <p className="text-sm">
              {[nextEvent.eventDate, nextEvent.eventTime, nextEvent.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <ParishCountdown isoDate={nextEvent.eventDate} time={nextEvent.eventTime} />
          <ParishButton href={path(`/events/${nextEvent.id}`)} variant="gold">Details</ParishButton>
        </section>
      ) : null}

      <section className="parish-section">
        <p className="parish-lead">{intro}</p>
      </section>

      <section className="parish-section parish-split">
        <div>
          <p className="parish-eyebrow">About us</p>
          <h2 className="parish-display mt-2 text-[var(--parish-forest)]">
            {model.website.aboutHeadline || "Our Parish History"}
          </h2>
          <p className="parish-muted mt-4">{history}</p>
          <div className="mt-6">
            <ParishButton href={path("/about")}>More about us</ParishButton>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md">
          <Image src={historyImage} alt="" fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
        </div>
      </section>

      <section className="parish-section parish-section-compact">
        <div className="parish-watch">
          <div className="parish-watch-intro">
            <p className="parish-eyebrow">Media</p>
            <h2 className="parish-display mt-2 text-[var(--parish-forest)]">Watch & Listen</h2>
            <p className="parish-muted mt-3 max-w-sm">
              Explore sermons, worship songs and short videos from our church.
            </p>
            <ParishButton href={path("/videos")} className="parish-watch-cta mt-5">
              Explore Media →
            </ParishButton>
          </div>
          <div className="parish-watch-cards">
            {[
              {
                href: "/videos",
                title: "Videos",
                action: "Watch Videos",
                image: model.videos.find((video) => video.thumbnailUrl)?.thumbnailUrl || PARISH_DEFAULTS.sermons[0],
                Icon: Clapperboard,
              },
              {
                href: "/songs",
                title: "Songs",
                action: "Listen to Songs",
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
            <p className="parish-eyebrow">Join us</p>
            <h2 className="parish-display text-[var(--parish-forest)]">Church Events & Gatherings</h2>
            <p className="parish-muted mx-auto mt-3 max-w-2xl">
              Upcoming gatherings at {model.church.name}.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {events.length === 0
              ? ["Parish breakfast", "Evening gathering", "Community visit"].map((title, index) => (
                  <Link key={title} href={path("/events")} className="parish-event-row">
                    <Image src={PARISH_DEFAULTS.events[index]!} alt="" width={220} height={140} className="h-28 w-full object-cover sm:h-full sm:w-40" />
                    <div>
                      <p className="parish-eyebrow">Sample</p>
                      <h3 className="parish-display mt-1 text-2xl">{title}</h3>
                      <p className="parish-muted mt-1 text-sm">Starter card until {model.church.name} publishes an event.</p>
                    </div>
                    <span className="parish-eyebrow px-4">View events</span>
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
                      <p className="parish-eyebrow">{[event.eventDate, event.eventTime].filter(Boolean).join(" · ") || "Upcoming"}</p>
                      <h3 className="parish-display mt-1 text-2xl">{event.title}</h3>
                      <p className="parish-muted mt-1 line-clamp-2 text-sm">{event.description}</p>
                    </div>
                    <span className="parish-eyebrow px-4">View details</span>
                  </Link>
                ))}
          </div>
          <div className="mt-6 text-center">
            <ParishButton href={path("/events")}>View all events</ParishButton>
          </div>
        </section>
      ) : null}

      <section className="parish-band">
        <div className="parish-section parish-section-compact">
          <h2 className="parish-display text-center">Explore Faith Resources</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#efe6d6]">
            Discover resources to help you grow in faith, learn Scripture and stay connected with our church.
          </p>
          <div className="parish-card-grid cols-4 mt-6">
            {[
              { href: "/community", title: "Community", description: "Join conversations and groups with the church.", action: "Explore Community", image: PARISH_DEFAULTS.gallery[0] },
              { href: "/books", title: "Books", description: "Explore Christian books and reading resources.", action: "Browse Books", image: PARISH_DEFAULTS.stories[2] },
              { href: "/shepherd", title: "Shepherd AI", description: "Ask questions and find guidance for your faith.", action: "Open Shepherd AI", image: PARISH_DEFAULTS.quote },
              { href: "/prayer", title: "Prayer Requests", description: "Share a need or pray with the church.", action: "Submit a Prayer Request", image: PARISH_DEFAULTS.ministries[3] },
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
          <p className="parish-eyebrow">Latest sermons</p>
          <h2 className="parish-display text-[var(--parish-forest)]">Online Sermons</h2>
          <p className="parish-muted mx-auto mt-3 max-w-2xl">
            Messages from {model.church.name}.
          </p>
          <div className="parish-card-grid cols-4 mt-8 text-left">
            {(sermons.length > 0 ? sermons : [0, 1, 2, 3].map((index) => ({
              id: `sample-sermon-${index}`,
              title: ["A welcome to worship", "Living the parish life", "Prayer and fellowship", "The Sunday message"][index]!,
              speaker: "Sample",
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
                  {"sample" in sermon ? <p className="parish-eyebrow px-4 pt-3">Sample</p> : null}
                  <h3>{sermon.title}</h3>
                  {sermon.speaker ? <p className="parish-muted px-4 pb-3 text-sm">{sermon.speaker}</p> : null}
                </Link>
              ))}
          </div>
          <div className="mt-6">
            <ParishButton href={path("/sermons")}>View all sermons</ParishButton>
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
          <p className="parish-eyebrow">Latest stories</p>
          <h2 className="parish-display text-[var(--parish-forest)]">Stories that Inspire</h2>
          <p className="parish-muted mx-auto mt-3 max-w-2xl">Writing and stories from the parish.</p>
          <div className="parish-card-grid cols-3 mt-8 text-left">
            {(articles.length > 0 ? articles : [0, 1, 2].map((index) => ({
              id: `sample-story-${index}`,
              title: ["Faith in ordinary days", "A parish welcome", "Serving together"][index]!,
              coverImage: PARISH_DEFAULTS.stories[index],
              category: "Sample",
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
                  <span className="parish-eyebrow px-4 pb-3">Read more</span>
                </Link>
              ))}
          </div>
          <div className="mt-6">
            <ParishButton href={path("/articles")}>View all articles</ParishButton>
          </div>
        </section>
      ) : null}

      <section className="parish-section parish-center">
        <h2 className="parish-display text-[var(--parish-forest)]">We&apos;d love to hear from you</h2>
        <p className="parish-muted mx-auto mt-3 max-w-xl">
          {address || `Contact ${model.church.name} to plan a visit or ask a question.`}
        </p>
        {model.church.email ? <p className="mt-2">{model.church.email}</p> : null}
        {model.church.phone ? <p>{model.church.phone}</p> : null}
        <div className="mt-6 flex justify-center gap-3">
          <ParishButton href={path("/about")}>Visit us</ParishButton>
          <ParishButton href={path("/contact")} variant="gold">Contact us</ParishButton>
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
