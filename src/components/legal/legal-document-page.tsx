import Link from "next/link";

import { siteConfig } from "@/config/site";
import { pageProseClass, typePageTitleClass } from "@/lib/responsive-classes";

export type LegalSection = {
  title: string;
  icon: string;
  paragraphs?: string[];
  list?: string[];
  footer?: string;
  contact?: {
    name: string;
    email: string;
    location: string;
  };
};

type LegalDocumentPageProps = {
  title: string;
  description: string;
  headerIcon: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalDocumentPage({
  title,
  description,
  headerIcon,
  effectiveDate,
  lastUpdated,
  sections,
}: LegalDocumentPageProps) {
  return (
    <div className={`${pageProseClass} py-4 sm:py-6`}>
      <div className="w-full">
        <header className="mb-10 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                {headerIcon}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                  Legal Document
                </p>
                <h1 className={typePageTitleClass}>
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">{siteConfig.name}</p>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Effective: {effectiveDate}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Last updated: {lastUpdated}
              </span>
            </div>
          </div>
        </header>

        <nav className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card/50 px-6 py-5 sm:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary/60">
            Contents
          </p>
          <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#section-${index}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:text-sm"
                >
                  <span className="w-4 shrink-0 text-center text-[10px] font-bold text-primary/40">
                    {index + 1}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <section
              key={section.title}
              id={`section-${index}`}
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4 sm:px-8">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base">
                  {section.icon}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-primary/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-heading text-sm font-bold leading-snug sm:text-base">
                    {section.title}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 px-6 py-5 sm:px-8 sm:py-6">
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 64)}
                    className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-[1.7]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list ?
                  <ul className="space-y-2">
                    {section.list.map((item) => (
                      <li
                        key={item.slice(0, 64)}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                : null}

                {section.footer ?
                  <p className="rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-sm italic leading-relaxed text-muted-foreground">
                    {section.footer}
                  </p>
                : null}

                {section.contact ?
                  <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {section.contact.name}
                    </p>
                    <div className="mt-2 space-y-1">
                      <a
                        href={`mailto:${section.contact.email}`}
                        className="flex items-center gap-2 text-sm text-primary transition-colors hover:underline"
                      >
                        <span aria-hidden>✉</span>
                        {section.contact.email}
                      </a>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span aria-hidden>📍</span>
                        {section.contact.location}
                      </p>
                    </div>
                  </div>
                : null}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          © 2026 {siteConfig.name} · All rights reserved ·{" "}
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
