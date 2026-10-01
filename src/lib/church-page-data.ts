import { cache } from "react";

import type { FirebaseChurch } from "@/types/firebase-church";

import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { TemplateId } from "@/lib/templates/types";

import { resolveCurrentMemberChurchContext } from "@/lib/organization/resolve-current-church-server";

export const getPageTenantContext = cache(async (): Promise<{
  scope: TenantScope;
  church: FirebaseChurch | null;
  defaultBranchId: string | null;
  activeTemplate: TemplateId | null;
}> => {
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
