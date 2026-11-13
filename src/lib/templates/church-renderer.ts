import type { TemplateId } from "@/lib/templates/types";

/**
 * Signature keeps the existing application. Heritage and Parish are dedicated
 * public church websites. Unimplemented ids must not fall through to them.
 */
export function usesDedicatedChurchWebsite(templateId: TemplateId): boolean {
  return templateId === "heritage" || templateId === "parish";
}

export function usesSignatureAppExperience(templateId: TemplateId): boolean {
  return !usesDedicatedChurchWebsite(templateId);
}
