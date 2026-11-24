"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { legalHref, safeLegalReturnTo } from "@/legal/return-to";

import type { LegalSection } from "@/legal/types";

type Props = {
  title: string;
  summary: string;
  versionLabel: string | null;
  effectiveOn: string | null;
  updatedOn: string | null;
  authoritativeLanguageNote: string | null;
  sections: LegalSection[];
  related: { href: string; label: string }[];
};

function sectionText(section: LegalSection): string {
  return section.blocks
    .map((block) => (block.type === "list" ? block.items.join(" ") : block.text))
    .join(" ");
}

export function LegalDocumentReader(props: Props) {
  const returnTo = safeLegalReturnTo(useSearchParams().get("returnTo"));
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(props.sections[0]?.id ?? "");

  useEffect(() => {
    const nodes = props.sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.4] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [props.sections]);
  const normalized = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      props.sections.filter((section) => {
        if (!normalized) return true;
        return (
          section.title.toLowerCase().includes(normalized) ||
          sectionText(section).toLowerCase().includes(normalized)
        );
      }),
    [normalized, props.sections]
  );

  return (
    <article className="legal-document">
      <header className="mb-8 max-w-[820px]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A3B]">Koinia</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">{props.title}</h1>
        <p className="mt-3 text-lg leading-8 text-[#3E4C59]">{props.summary}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#5C6B7A]">
          {props.versionLabel ? (
            <div>
              <dt className="inline">Version </dt>
              <dd className="inline text-[#1C2B3A]">{props.versionLabel}</dd>
            </div>
          ) : null}
          {props.effectiveOn ? (
            <div>
              <dt className="inline">Effective </dt>
              <dd className="inline">{props.effectiveOn}</dd>
            </div>
          ) : null}
          {props.updatedOn ? (
            <div>
              <dt className="inline">Updated </dt>
              <dd className="inline">{props.updatedOn}</dd>
            </div>
          ) : null}
        </dl>
        {props.authoritativeLanguageNote ? (
          <p className="mt-4 border border-[#E2D9CC] bg-white px-3 py-2 text-sm leading-6" role="note">
            {props.authoritativeLanguageNote}
          </p>
        ) : null}
      </header>

      <div className="legal-workspace grid items-start gap-10 lg:grid-cols-[220px_minmax(0,820px)]">
        <aside className="legal-toc lg:sticky lg:top-6">
          <details className="rounded-md border border-[#E2D9CC] bg-white lg:hidden" open>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Contents</summary>
            <Toc sections={visible} active={active} />
          </details>
          <div className="hidden lg:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5C6B7A]">
              Contents
            </p>
            <Toc sections={visible} active={active} />
          </div>
        </aside>

        <div>
          <label className="mb-6 block text-sm">
            <span className="mb-1 block text-[#5C6B7A]">Search this document</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-md border border-[#E2D9CC] bg-white px-3 py-2"
              type="search"
            />
          </label>
          {visible.length === 0 ? (
            <p className="text-sm">No sections match that search.</p>
          ) : null}
          <div className="space-y-8">
            {visible.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
                onFocus={() => setActive(section.id)}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-xl font-semibold">
                    <span className="mr-2 text-[#8A5A3B]">{index + 1}.</span>
                    {section.title}
                  </h2>
                  <button
                    type="button"
                    className="text-xs text-[#5C6B7A] underline"
                    onClick={() => {
                      const url = `${window.location.pathname}#${section.id}`;
                      void navigator.clipboard?.writeText(window.location.origin + url);
                      history.replaceState(null, "", `#${section.id}`);
                      setActive(section.id);
                    }}
                  >
                    Copy link
                  </button>
                </div>
                <div className="space-y-3 text-[1.02rem] leading-7 text-[#243140]">
                  {section.blocks.map((block, blockIndex) =>
                    block.type === "list" ? (
                      <ul key={blockIndex} className="list-disc space-y-1 pl-5">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={blockIndex}>{block.text}</p>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
          <aside className="mt-10 border-t border-[#E2D9CC] pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5C6B7A]">
              Related documents
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {props.related.map((item) => (
                <li key={item.href}>
                  <a className="underline" href={legalHref(item.href, returnTo)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <a href="#top" className="mt-4 inline-block text-sm underline">
              Back to top
            </a>
          </aside>
        </div>
      </div>
      <style>{`
        @media print {
          .legal-center header, .legal-center footer, .legal-toc, .legal-workspace label, button { display: none !important; }
          .legal-center { background: white !important; }
          .legal-workspace { display: block !important; }
        }
      `}</style>
    </article>
  );
}

function Toc({ sections, active }: { sections: LegalSection[]; active: string }) {
  return (
    <nav aria-label="Document sections">
      <ol className="space-y-1 text-sm">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "location" : undefined}
              className={
                active === section.id
                  ? "block rounded-sm bg-[#F6F1E7] px-2 py-1 font-medium"
                  : "block rounded-sm px-2 py-1 text-[#3E4C59] hover:bg-[#F6F1E7]"
              }
            >
              {index + 1}. {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
