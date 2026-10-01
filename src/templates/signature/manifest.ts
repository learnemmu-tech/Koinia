import type { TemplateManifest } from "@/lib/templates/types";

export const signatureManifest: TemplateManifest = {
  id: "signature",
  name: "Signature",
  description:
    "The existing FaithConnectHub design — warm, contemporary, and welcoming.",
  previewImage: "/templates/signature/preview.svg",
  implemented: true,
  supportedSections: [
    "home",
    "about",
    "sermons",
    "sermonDetail",
    "events",
    "eventDetail",
    "ministries",
    "articles",
    "articleDetail",
    "videos",
    "give",
    "giveDetail",
    "contact",
    "prayer",
    "memberGate",
  ],
  imageSlots: ["hero", "about", "logo", "favicon", "socialPreview"],
};
