import type { FirebaseChurch } from "@/types/firebase-church";



import type { TenantScope } from "@/lib/organization/tenant-scope";



import { getChurchByIdCached } from "./cached-church-data";

import {

  getActiveBranchIdFromCookies,

  resolveActiveChurchId,

} from "./church-server";



export async function getPageTenantContext(): Promise<{

  scope: TenantScope;

  church: FirebaseChurch | null;

  defaultBranchId: string | null;

}> {

  const churchId = await resolveActiveChurchId();

  const church = churchId ? await getChurchByIdCached(churchId) : null;

  const branchFromCookie = await getActiveBranchIdFromCookies();



  const organizationId = church?.organizationId?.trim() || "";

  const defaultBranchId = church?.defaultBranchId?.trim() || null;

  const branchId =

    branchFromCookie?.trim() || defaultBranchId || "";



  return {

    scope: {

      organizationId,

      churchId: churchId || "",

      branchId: branchId || undefined,

    },

    church,

    defaultBranchId,

  };

}



/** @deprecated Use getPageTenantContext */

export async function getPageChurchContext(): Promise<{

  churchId: string;

  church: FirebaseChurch | null;

}> {

  const { scope, church } = await getPageTenantContext();

  return { churchId: scope.churchId ?? "", church };

}


