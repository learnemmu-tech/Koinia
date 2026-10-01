import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { resolveHeritageImage } from "@/templates/heritage/lib";
import {
  HERITAGE_FALLBACK_HEADLINE,
  HERITAGE_FALLBACK_IMAGES,
  HERITAGE_FALLBACK_SCRIPTURE,
  HERITAGE_FALLBACK_SUPPORTING,
} from "@/templates/heritage/theme";

import "@/templates/heritage/heritage.css";

export function HeritageAuthShell({
  model,
  children,
}: {
  model: ChurchWebsiteViewModel;
  children: React.ReactNode;
}) {
  const homeHref = churchWebsitePath(model.church.slug);
  const logo = model.website.images.logo || HERITAGE_FALLBACK_IMAGES.mark;
  const image = resolveHeritageImage(
    model.website.images.hero,
    HERITAGE_FALLBACK_IMAGES.hero
  );
  const headline =
    model.website.heroHeadline?.trim() || HERITAGE_FALLBACK_HEADLINE;
  const supporting =
    model.website.heroSubheadline?.trim() ||
    model.church.welcomeMessage?.trim() ||
    model.church.description?.trim() ||
    HERITAGE_FALLBACK_SUPPORTING;
  const scriptureText =
    model.website.scriptureText?.trim() || HERITAGE_FALLBACK_SCRIPTURE.text;
  const scriptureRef =
    model.website.scriptureReference?.trim() ||
    HERITAGE_FALLBACK_SCRIPTURE.reference;

  return (
    <div className="heritage-theme heritage-auth-shell">
      <header className="heritage-auth-bar">
        <Link
          href={homeHref}
          className="flex min-w-0 items-center gap-3 text-[var(--heritage-primary-foreground)]"
        >
          <span className="relative size-8 shrink-0 overflow-hidden sm:size-9">
            <Image
              src={logo}
              alt={`${model.church.name} logo`}
              fill
              className="object-contain"
              sizes="36px"
            />
          </span>
          <span className="heritage-display truncate text-[1.05rem] sm:text-lg">
            {model.church.name}
          </span>
        </Link>
        <Link href={homeHref} className="heritage-auth-back">
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to website
        </Link>
      </header>

      <div className="heritage-auth-body">
        <aside className="heritage-auth-visual" aria-hidden={false}>
          <div className="heritage-auth-media">
            <HeritageImage
              src={image}
              alt=""
              fallback={HERITAGE_FALLBACK_IMAGES.hero}
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
            />
            <div className="heritage-hero-overlay absolute inset-0" />
          </div>
          <div className="heritage-auth-visual-copy">
            <p className="heritage-eyebrow text-[var(--heritage-accent)]">
              {model.church.name}
            </p>
            <h2 className="heritage-display mt-3 max-w-lg whitespace-pre-line text-[length:var(--heritage-hero)] text-[var(--heritage-primary-foreground)]">
              {headline}
            </h2>
            <p className="mt-4 max-w-md text-[length:var(--heritage-body)] leading-[1.65] text-[color-mix(in_srgb,var(--heritage-primary-foreground)_82%,transparent)]">
              {supporting}
            </p>
            <blockquote className="mt-8 max-w-md border-l border-[color-mix(in_srgb,var(--heritage-accent)_70%,transparent)] pl-4 text-sm italic leading-relaxed text-[color-mix(in_srgb,var(--heritage-primary-foreground)_78%,transparent)]">
              <p>“{scriptureText}”</p>
            <footer className="mt-2 not-italic tracking-[0.08em] text-[var(--heritage-accent)]">
                — {scriptureRef}
              </footer>
            </blockquote>
          </div>
        </aside>

        <section className="heritage-auth-panel">
          <div className="heritage-auth-ornament" aria-hidden />
          <div className="heritage-auth-form-frame">{children}</div>
        </section>
      </div>
    </div>
  );
}
