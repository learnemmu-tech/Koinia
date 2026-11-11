import { cache } from "react";

import type { FirebaseChurch } from "@/types/firebase-church";

import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { TemplateId } from "@/lib/templates/types";

import { resolveCurrentMemberChurchContext } from "@/lib/organization/resolve-current-church-server";
import { getRequestChurchUrlScope } from "@/lib/templates/church-url-request";
import { cachedPublicChurchCore } from "@/lib/templates/load-church-website";

export const getPageTenantContext = cache(async (): Promise<{
  scope: TenantScope;
  church: FirebaseChurch | null;
  defaultBranchId: string | null;
  activeTemplate: TemplateId | null;
}> => {
  // A /c/[slug] page already names the church. Resolving the signed-in
  // member's active church here was five sequential Neon round trips
  // before the page could render, on every template.
  const urlChurch = await getRequestChurchUrlScope();
  if (urlChurch) {
    const core = await cachedPublicChurchCore(urlChurch.slug);
    const church = core
      ? { ...core.church, activeTemplate: core.templateId }
      : null;
    return {
      scope: {
        organizationId: urlChurch.organizationId,
        churchId: urlChurch.churchId,
      },
      church,
      defaultBranchId: church?.defaultBranchId?.trim() || null,
      activeTemplate: core?.templateId ?? null,
    };
  }

  const { scope, church, activeTemplate } =
    await resolveCurrentMemberChurchContext();

  return {
    scope,
    church,
    defaultBranchId: church?.defaultBranchId?.trim() || null,
    activeTemplate,
  };
});

/** @deprecated Use getPageTenantContext */
export async function getPageChurchContext(): Promise<{
  churchId: string;
  church: FirebaseChurch | null;
}> {
  const { scope, church } = await getPageTenantContext();
  return { churchId: scope.churchId ?? "", church };
}
