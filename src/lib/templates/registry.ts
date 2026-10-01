import { heritageManifest } from "@/templates/heritage/manifest";
import { sanctuaryManifest } from "@/templates/sanctuary/manifest";
import { signatureManifest } from "@/templates/signature/manifest";
import type { TemplateId, TemplateManifest } from "@/lib/templates/types";

const MANIFESTS: Record<TemplateId, TemplateManifest> = {
  signature: signatureManifest,
  heritage: heritageManifest,
  sanctuary: sanctuaryManifest,
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "signature";

export function listTemplateManifests(): TemplateManifest[] {
  return [signatureManifest, heritageManifest, sanctuaryManifest];
}

export function getTemplateManifest(id: TemplateId): TemplateManifest {
  return MANIFESTS[id];
}

export function isTemplateId(value: string | null | undefined): value is TemplateId {
  return value === "signature" || value === "heritage" || value === "sanctuary";
}

export function parseTemplateId(
  value: string | null | undefined,
  fallback: TemplateId = DEFAULT_TEMPLATE_ID
): TemplateId {
  return isTemplateId(value) ? value : fallback;
}

export function resolveRenderableTemplateId(id: TemplateId): TemplateId {
  const manifest = MANIFESTS[id];
  if (!manifest.implemented) return DEFAULT_TEMPLATE_ID;
  return id;
}
