import { heritagePages } from "@/templates/heritage/pages";
import { parishPages } from "@/templates/parish/pages";
import { signaturePages } from "@/templates/signature/pages";
import { resolvePublicTemplateId } from "@/lib/templates/resolver";
import type { TemplateId, TemplatePages } from "@/lib/templates/types";

export function getTemplatePages(templateId: TemplateId): TemplatePages {
  const id = resolvePublicTemplateId(templateId);
  if (id === "heritage") return heritagePages;
  if (id === "parish") return parishPages;
  return signaturePages;
}
