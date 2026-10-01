import type { TemplateManifest } from "@/lib/templates/types";

export const sanctuaryManifest: TemplateManifest = {
  id: "sanctuary",
  name: "Sanctuary",
  description: "Coming soon.",
  previewImage: "/templates/sanctuary/preview.svg",
  implemented: false,
  supportedSections: ["home"],
  imageSlots: ["hero", "about", "logo", "favicon", "socialPreview"],
};
