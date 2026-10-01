"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
  UserRound,
} from "lucide-react";

import { SermonMediaSection } from "@/components/sermons/sermon-media-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getYouTubeVideoId } from "@/lib/media-url-validation";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { formatLongDate, resolveHeritageImage } from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

export function HeritageFeaturedSermon({
  model,
  sermons,
}: {
  model: ChurchWebsiteViewModel;
  sermons: FirebaseSermon[];
}) {
  const [index, setIndex] = useState(0);
  const slug = model.church.slug;
  const allSermons = churchWebsitePath(slug, "/sermons");
  const sermon = sermons[index];
  const image = resolveHeritageImage(
    sermon?.coverImage || model.website.images.worship,
    HERITAGE_FALLBACK_IMAGES.featuredSermon
  );

  if (!sermon) {
    return (
      <article className="heritage-on-dark heritage-sermon-feature">
        <div className="heritage-sermon-feature-media">
          <HeritageImage
            src={image}
            alt=""
            fallback={HERITAGE_FALLBACK_IMAGES.featuredSermon}
            className="object-cover object-[center_35%]"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
        </div>
        <div className="heritage-sermon-feature-scrim" />
        <div className="heritage-sermon-feature-top">
          <p className="heritage-sermon-pill">Featured Sermon</p>
        </div>
        <div className="heritage-sermon-play-spacer" aria-hidden />
        <div className="heritage-sermon-feature-footer">
          <div className="heritage-sermon-feature-copy">
            <h2 className="heritage-sermon-feature-title">Latest Message</h2>
            <Link href={allSermons} className="heritage-btn heritage-btn-inverse mt-5">
              Browse sermons
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <FeaturedSermonPlayback
      sermon={sermon}
      image={image}
      href={churchWebsitePath(slug, `/sermons/${sermon.id}`)}
      index={index}
      total={sermons.length}
      onPrev={() => setIndex((current) => (current - 1 + sermons.length) % sermons.length)}
      onNext={() => setIndex((current) => (current + 1) % sermons.length)}
    />
  );
}

function FeaturedSermonPlayback({
  sermon,
  image,
  href,
  index,
  total,
  onPrev,
  onNext,
}: {
  sermon: FirebaseSermon;
  image: string;
  href: string;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const youtube = sermon.youtubeUrl?.trim() ?? "";
  const audio = sermon.audioUrl?.trim() ?? "";
  const youtubePlayable = Boolean(getYouTubeVideoId(youtube));
  const playable = youtubePlayable || Boolean(audio);
  const action = youtubePlayable ? "Watch Now" : audio ? "Listen Now" : "Read Sermon";
  const dateLabel = formatLongDate(sermon.dateCreated);
  const speaker = sermon.speaker?.trim();
  const scripture = sermon.scriptureReference?.trim();
  const description = sermon.shortDescription?.trim() || sermon.subtitle?.trim();
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  function openPlayer() {
    if (playable) setOpen(true);
  }

  return (
    <article className="heritage-on-dark heritage-sermon-feature">
      <div className="heritage-sermon-feature-media">
        <HeritageImage
          src={image}
          alt={sermon.title}
          fallback={HERITAGE_FALLBACK_IMAGES.featuredSermon}
          className="object-cover object-[center_35%]"
          sizes="(max-width: 1024px) 100vw, 58vw"
        />
      </div>
      <div className="heritage-sermon-feature-scrim" />
      <div className="heritage-sermon-feature-top">
        <p className="heritage-sermon-pill">Featured Sermon</p>
        {total > 1 ? (
          <div className="heritage-sermon-pager">
            <span>{counter}</span>
            <button type="button" onClick={onPrev} aria-label="Previous sermon">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button type="button" onClick={onNext} aria-label="Next sermon">
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      {playable ? (
        <button
          type="button"
          className="heritage-sermon-play"
          onClick={openPlayer}
          aria-label={action}
        >
          <span className="heritage-sermon-play-mark" aria-hidden>
            <Play className="size-7 fill-current" />
          </span>
        </button>
      ) : (
        <div className="heritage-sermon-play-spacer" aria-hidden />
      )}
      <div className="heritage-sermon-feature-footer">
        <div className="heritage-sermon-feature-copy">
          <h2 className="heritage-sermon-feature-title">{sermon.title}</h2>
          <ul className="heritage-sermon-feature-meta">
            {speaker ? (
              <li>
                <UserRound className="size-3.5" aria-hidden />
                {speaker}
              </li>
            ) : null}
            {dateLabel ? (
              <li>
                <CalendarDays className="size-3.5" aria-hidden />
                {dateLabel}
              </li>
            ) : null}
          </ul>
          {description ? <p className="heritage-sermon-feature-lede">{description}</p> : null}
          <div className="heritage-sermon-feature-actions">
            {playable ? (
              <button
                type="button"
                className="heritage-btn heritage-btn-inverse"
                onClick={openPlayer}
              >
                {action}
                <Play className="ml-0.5 size-3.5 fill-current" aria-hidden />
              </button>
            ) : null}
            <Link href={href} className="heritage-btn heritage-btn-secondary">
              View Sermon Details
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        {scripture ? (
          <p className="heritage-sermon-feature-scripture">{scripture}</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="heritage-theme heritage-sermon-player-dialog max-w-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{sermon.title}</DialogTitle>
            {speaker || dateLabel ? (
              <DialogDescription>
                {[speaker, dateLabel, scripture].filter(Boolean).join(" · ")}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          {playable ? (
            <SermonMediaSection
              title={sermon.title}
              youtubeUrl={youtubePlayable ? youtube : undefined}
              audioUrl={audio || undefined}
              autoPlay
            />
          ) : (
            <p className="text-sm text-[var(--heritage-muted)]">
              This sermon does not have a playable video or audio file.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
}
