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

function MembersContent() {
  const { profile } = useFirebaseAuth();
  const { organization, churches } = useOrganization();
  const { activeChurchId } = useActiveChurch();
  const { activeBranch } = useActiveBranch();

  const churchId = resolveEffectiveChurchId({
    profile,
    activeChurchId,
    orgChurches: churches,
  });
  const church =
    churches.find((item) => item.id === churchId) ?? churches[0] ?? null;
  const churchName =
    activeBranch?.name ?? church?.name ?? organization?.name ?? "your church";

  if (
    isMultiChurchOrgWorkspace(organization) &&
    (!churchId || !activeBranch)
  ) {
    return (
      <div className={adminSectionClass}>
        <AdminPageHeader
          eyebrow="Workspace"
          title="Members"
          description="Manage join requests and approved members for your churches."
        />
        <WorkspaceChurchRequiredNotice />
      </div>
    );
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        eyebrow="Workspace"
        title="Members"
        description={`Manage join requests and approved members for ${churchName}.`}
      >
        <DashboardBranchSwitcher />
      </AdminPageHeader>

      {!organization || !activeBranch ?
        <p className="text-sm text-muted-foreground">
          Select a church workspace to manage members.
        </p>
      : <ChurchMembersPanel
          branchId={activeBranch.id}
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
