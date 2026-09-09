"use client";

import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationSettingsPanel } from "@/components/admin/donation-settings-panel";
import { adminSectionClass } from "@/lib/responsive-classes";

export function AdminDonationSettingsPageClient() {
  const t = useTranslations("dashboard");

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title={t("donationSettings")}
        description={t("donationSettingsDescription")}
      />
      <DonationSettingsPanel />
    </div>
  );
}
