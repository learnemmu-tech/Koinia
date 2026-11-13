"use client";

import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { websitePreviewPath } from "@/lib/templates/paths";
import { canSelectTemplate } from "@/lib/templates/resolver";
import type { TemplateId, TemplateManifest } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

type WebsiteTemplateGalleryProps = {
  templates: TemplateManifest[];
  activeTemplate?: TemplateId | null;
  churchSlug: string;
  saving?: boolean;
  selectingId?: TemplateId | null;
  highlightActive?: boolean;
  /** Onboarding uses the reference gallery. Admin keeps the existing 3-column gallery. */
  layout?: "admin" | "onboarding";
  onSelect: (templateId: TemplateId) => void;
};

const ONBOARDING_TAGS: Partial<Record<TemplateId, string[]>> = {
  signature: ["Modern", "Welcoming", "Versatile"],
  heritage: ["Traditional", "Editorial", "Elegant"],
  parish: ["Parish", "Community", "Ministry"],
};

const previewButtonClass = "w-full";
const selectButtonClass = "w-full";

export function WebsiteTemplateGallery({
  templates,
  activeTemplate = null,
  churchSlug,
  saving = false,
  selectingId = null,
  highlightActive = true,
  layout = "admin",
  onSelect,
}: WebsiteTemplateGalleryProps): JSX.Element {
  if (layout === "onboarding") {
    return (
      <OnboardingGallery
        templates={templates}
        churchSlug={churchSlug}
        saving={saving}
        selectingId={selectingId}
        activeTemplate={highlightActive ? activeTemplate : null}
        onSelect={onSelect}
      />
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {templates.map((template) => {
        const selected = highlightActive && activeTemplate === template.id;
        const selectable = canSelectTemplate(template);
        const isSelecting = selectingId === template.id;
        const previewHref = selectable
          ? websitePreviewPath(template.id, {
              mode: churchSlug ? "live" : "demo",
              slug: churchSlug || undefined,
            })
          : undefined;

        return (
          <li key={template.id}>
            <article
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border",
                !selectable && "opacity-80"
              )}
            >
              <div className="relative aspect-[16/10] bg-muted">
                <Image
                  src={template.previewImage}
                  alt={`${template.name} website preview`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {selected ? (
                  <p className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    <Check className="size-3.5" aria-hidden />
                    Current design
                  </p>
                ) : null}
                {!selectable ? (
                  <p className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Coming soon
                  </p>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {template.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <PreviewAction name={template.name} href={previewHref} />
                  <SelectAction
                    template={template}
                    selectable={selectable}
                    selected={selected}
                    saving={saving}
                    isSelecting={isSelecting}
                    onSelect={onSelect}
                  />
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function TemplateMiniPreview({ id }: { id: TemplateId }) {
  if (id === "heritage") {
    return (
      <>
        <Image
          src="/templates/heritage/hero-fallback.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />
        <div className="absolute inset-x-0 top-0 flex gap-2 px-3 py-2 text-[10px] text-white/80">
          <span className="font-semibold text-white">Church</span>
          <span className="ml-auto">Home</span>
          <span>Sermons</span>
          <span>Give</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/75">Welcome</p>
          <p className="font-heading text-lg leading-tight">A place to belong</p>
        </div>
      </>
    );
  }

  if (id === "parish") {
    return (
      <>
        <Image
          src="/templates/heritage/songs-worship.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-[#122820]/55" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-[#c6a36a]/40 px-3 py-2 text-[10px] text-[#f4efe4]">
          <span className="font-heading text-sm">Parish</span>
          <span className="ml-auto">Worship</span>
          <span>Events</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 text-[#f4efe4]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a36a]">Welcome</p>
          <p className="font-heading text-lg leading-tight">Songs of the parish</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Image
        src="/templates/heritage/worship-fallback.jpg"
        alt=""
        fill
        className="object-cover opacity-25"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-background/75" />
      <div className="absolute inset-0 flex flex-col p-3">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">Church</span>
          <span className="ml-auto">Home</span>
          <span>Sermons</span>
          <span>Events</span>
        </div>
        <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-primary">Welcome</p>
        <p className="font-heading text-lg leading-tight text-foreground">Welcome home</p>
        <div className="mt-2 flex gap-1">
          <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">Join</span>
          <span className="rounded-sm border border-border bg-card px-1.5 py-0.5 text-[9px]">Sermons</span>
        </div>
      </div>
    </>
  );
}

function OnboardingGallery({
  templates,
  churchSlug,
  saving,
  selectingId,
  activeTemplate,
  onSelect,
}: {
  templates: TemplateManifest[];
  churchSlug: string;
  saving: boolean;
  selectingId: TemplateId | null;
  activeTemplate: TemplateId | null;
  onSelect: (templateId: TemplateId) => void;
}) {
  const available = templates.filter((template) => template.id !== "sanctuary");
  const sanctuary = templates.find((template) => template.id === "sanctuary");

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {available.map((template) => {
          const selectable = canSelectTemplate(template);
          const selected = activeTemplate === template.id;
          const isSelecting = selectingId === template.id;
          const previewHref = selectable
            ? websitePreviewPath(template.id, {
                mode: churchSlug ? "live" : "demo",
                slug: churchSlug || undefined,
              })
            : undefined;
          const tags = ONBOARDING_TAGS[template.id] ?? [];

          return (
            <li key={template.id} className="min-w-0">
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-card p-3 shadow-sm",
                  selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                {selected ? (
                  <span className="absolute -right-2 -top-2 z-10 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="size-4" aria-hidden />
                    <span className="sr-only">Selected</span>
                  </span>
                ) : null}
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                  <TemplateMiniPreview id={template.id} />
                </div>
                <div className="flex flex-1 flex-col gap-3 px-2 pb-2 pt-4">
                  <div className="space-y-1.5">
                    <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                      {template.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  {tags.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    <PreviewAction
                      name={template.name}
                      href={previewHref}
                      className={previewButtonClass}
                    />
                    <SelectAction
                      template={template}
                      selectable={selectable}
                      selected={selected}
                      saving={saving}
                      isSelecting={isSelecting}
                      onSelect={onSelect}
                      className={selectButtonClass}
                    />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {sanctuary ? (
        <SanctuaryRow
          template={sanctuary}
          saving={saving}
          isSelecting={selectingId === sanctuary.id}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}

function SanctuaryRow({
  template,
  saving,
  isSelecting,
  onSelect,
}: {
  template: TemplateManifest;
  saving: boolean;
  isSelecting: boolean;
  onSelect: (templateId: TemplateId) => void;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-3 opacity-80 shadow-sm sm:flex-row sm:items-center">
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl bg-muted sm:aspect-[16/6] sm:max-w-md">
        <Image
          src={template.previewImage}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 28rem"
        />
        <p className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Coming soon
        </p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground">{template.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-64">
          <PreviewAction name={template.name} className={previewButtonClass} />
          <SelectAction
            template={template}
            selectable={false}
            selected={false}
            saving={saving}
            isSelecting={isSelecting}
            onSelect={onSelect}
            className={selectButtonClass}
          />
        </div>
      </div>
    </article>
  );
}

function PreviewAction({
  name,
  href,
  className,
}: {
  name: string;
  href?: string;
  className?: string;
}) {
  if (href) {
    return (
      <Button asChild variant="outline" size="sm" className={className}>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Preview ${name} for your church website`}
        >
          Preview
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled
      aria-disabled="true"
      aria-label={`${name} is coming soon`}
    >
      Preview
    </Button>
  );
}

function SelectAction({
  template,
  selectable,
  selected,
  saving,
  isSelecting,
  onSelect,
  className,
}: {
  template: TemplateManifest;
  selectable: boolean;
  selected: boolean;
  saving: boolean;
  isSelecting: boolean;
  onSelect: (templateId: TemplateId) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      className={className}
      disabled={!selectable || saving}
      aria-disabled={!selectable || saving}
      aria-label={
        !selectable
          ? `${template.name} is coming soon`
          : selected
            ? `${template.name} is your current website design`
            : `Use ${template.name} for your church website`
      }
      onClick={() => onSelect(template.id)}
    >
      {isSelecting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {!selectable ? "Coming soon" : selected ? "Selected" : "Select template"}
    </Button>
  );
}
