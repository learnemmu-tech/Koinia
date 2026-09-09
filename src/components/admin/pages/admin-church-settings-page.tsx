"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { RequireAdmin } from "@/components/auth/require-admin";
import { RequireOrganizationAdmin } from "@/components/auth/require-organization-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationSettingsPanel } from "@/components/admin/donation-settings-panel";
import { ChurchMembersPanel } from "@/components/church/church-members-panel";
import { ChurchJoinUrlCard } from "@/components/church/church-join-url-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveBranch } from "@/context/active-branch-context";
import { useOrganization } from "@/context/organization-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import { isIndependentChurchWorkspace } from "@/lib/organization/workspace-type";

function ChurchSettingsContent() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { churches, organization } = useOrganization();
  const { activeBranch } = useActiveBranch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isIndependent = isIndependentChurchWorkspace(organization);
  const church = churches[0];
  const churchName = activeBranch?.name ?? church?.name ?? t("yourChurch");

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "members" && isIndependent) return tab;
    if (tab === "join-url" && isIndependent) return tab;
    if (tab === "donations") return tab;
    return "general";
  }, [searchParams, isIndependent]);

  function handleTabChange(value: string) {
    const query = value === "general" ? "" : `?tab=${value}`;
    router.replace(`/dashboard/church-settings${query}`, { scroll: false });
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title={t("churchSettings")}
        description={
          churchName ?
            t("churchSettingsFor", { name: churchName })
          : t("churchSettingsGeneric")
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          {isIndependent ?
            <TabsTrigger value="join-url">{t("joinUrl")}</TabsTrigger>
          : null}
          <TabsTrigger value="donations">{t("donationSettings")}</TabsTrigger>
          {isIndependent ?
            <TabsTrigger value="members">{tNav("members")}</TabsTrigger>
          : null}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {churchName ?
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("churchNameLabel")}</dt>
                <dd className="font-medium">{churchName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("phoneLabel")}</dt>
                <dd>{church?.phone?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("emailLabel")}</dt>
                <dd>{church?.email?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("websiteLabel")}</dt>
                <dd>{church?.website?.trim() || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">{t("addressLabel")}</dt>
                <dd>
                  {[
                    church?.address,
                    church?.city,
                    church?.state,
                    church?.country ?? activeBranch?.country ?? organization?.settings?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            </dl>
          : <p className="text-sm text-muted-foreground">{t("noChurchSelected")}</p>}
        </TabsContent>

        {isIndependent && activeBranch?.slug && organization ?
          <TabsContent value="join-url">
            <ChurchJoinUrlCard
              organizationId={organization.id}
              branchId={activeBranch.id}
              slug={activeBranch.slug}
              churchName={churchName}
              settings={activeBranch.settings}
              section="join-url"
            />
          </TabsContent>
        : null}

        <TabsContent value="donations">
          <DonationSettingsPanel />
        </TabsContent>

        {isIndependent && activeBranch ?
          <TabsContent value="members" className="space-y-6">
            <ChurchJoinUrlCard
              organizationId={organization!.id}
              branchId={activeBranch.id}
              slug={activeBranch.slug}
              churchName={churchName}
              settings={activeBranch.settings}
              section="enrollment"
            />
            <ChurchMembersPanel
              branchId={activeBranch.id}
              churchName={churchName}
            />
          </TabsContent>
        : null}
      </Tabs>
    </div>
  );
}

export function AdminChurchSettingsPageClient() {
  return (
    <RequireAdmin>
      <RequireOrganizationAdmin>
        <ChurchSettingsContent />
      </RequireOrganizationAdmin>
    </RequireAdmin>
  );
}
