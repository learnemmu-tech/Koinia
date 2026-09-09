"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChurchMembersPanel } from "@/components/church/church-members-panel";
import { DashboardBranchSwitcher } from "@/components/dashboard/dashboard-branch-switcher";
import { WorkspaceChurchRequiredNotice } from "@/components/workspace/workspace-church-required-notice";
import { useActiveBranch } from "@/context/active-branch-context";
import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { resolveEffectiveChurchId } from "@/lib/organization/resolve-effective-church";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";
import { adminSectionClass } from "@/lib/responsive-classes";
import { useTranslations } from "next-intl";

function MembersContent() {
  const { profile } = useFirebaseAuth();
  const { organization, churches } = useOrganization();
  const { activeChurchId } = useActiveChurch();
  const { activeBranch } = useActiveBranch();
  const t = useTranslations("members");

  const churchId = resolveEffectiveChurchId({
    profile,
    activeChurchId,
    orgChurches: churches,
  });
  const church =
    churches.find((item) => item.id === churchId) ?? churches[0] ?? null;
  const churchName =
    activeBranch?.name ?? church?.name ?? organization?.name ?? t("yourChurch");
  const resolvedChurchId = activeBranch?.id ?? church?.id ?? churchId;

  if (
    isMultiChurchOrgWorkspace(organization) &&
    (!churchId || !resolvedChurchId)
  ) {
    return (
      <div className={adminSectionClass}>
        <AdminPageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("descriptionGeneric")}
        />
        <WorkspaceChurchRequiredNotice />
      </div>
    );
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { name: churchName })}
      >
        <DashboardBranchSwitcher />
      </AdminPageHeader>

      {!organization || !resolvedChurchId ?
        <p className="text-sm text-muted-foreground">
          {t("selectChurch")}
        </p>
      : <ChurchMembersPanel
          branchId={resolvedChurchId}
          churchName={churchName}
        />
      }
    </div>
  );
}

export function AdminMembersPageClient() {
  return (
    <RequireAdmin>
      <MembersContent />
    </RequireAdmin>
  );
}
