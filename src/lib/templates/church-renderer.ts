/**
 * Heritage is the only public website template. Signature keeps the existing
 * application. Any other id must not fall through to the Heritage site.
 */
export function usesSignatureAppExperience(
  templateId: "signature" | "heritage" | "sanctuary"
): boolean {
  return templateId !== "heritage";
}
