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
  onSelect: (templateId: TemplateId) => void;
};

export function WebsiteTemplateGallery({
  templates,
  activeTemplate = null,
  churchSlug,
  saving = false,
  selectingId = null,
  highlightActive = true,
  onSelect,
}: WebsiteTemplateGalleryProps): JSX.Element {
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
                selected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border",
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
                  {previewHref ? (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={previewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Preview ${template.name} for your church website`}
                      >
                        Preview
                        <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      aria-disabled="true"
                      aria-label={`${template.name} is coming soon`}
                    >
                      Preview
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
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
                    {isSelecting ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    {!selectable
                      ? "Coming soon"
                      : selected
                        ? "Selected"
                        : "Select template"}
                  </Button>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
