import {
  DEFAULT_TEMPLATE_ID,
  getTemplateManifest,
  listTemplateManifests,
  parseTemplateId,
  resolveRenderableTemplateId,
} from "@/lib/templates/registry";
import type { TemplateId, TemplateManifest } from "@/lib/templates/types";

export {
  DEFAULT_TEMPLATE_ID,
  getTemplateManifest,
  listTemplateManifests,
  parseTemplateId,
  resolveRenderableTemplateId,
};

export function resolvePublicTemplateId(
  persisted: string | null | undefined
): TemplateId {
  return resolveRenderableTemplateId(parseTemplateId(persisted));
}

export function canSelectTemplate(manifest: TemplateManifest): boolean {
  return manifest.implemented;
}
