"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { useOrganizationOptional } from "@/context/organization-context";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";
import { Button } from "@/components/ui/button";

export function WorkspaceChurchRequiredNotice() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const scope = useContentTenantScope();
  const organization = useOrganizationOptional()?.organization;

  if (!scope.blocked || scope.isLoading) return null;
  if (!isMultiChurchOrgWorkspace(organization)) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-sm text-amber-900 dark:text-amber-100">
      <p className="font-medium">{t("createChurchToManage")}</p>
      <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
        {t("multiChurchNeedChurch")}
      </p>
      <Button asChild size="sm" className="mt-3">
        <Link href="/dashboard/organization?tab=churches">{tCommon("manageChurches")}</Link>
      </Button>
    </div>
  );
}
