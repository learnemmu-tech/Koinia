"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationSettingsPanel } from "@/components/admin/donation-settings-panel";
import { adminSectionClass } from "@/lib/responsive-classes";

export function AdminDonationSettingsPageClient() {
  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title="Donation Settings"
        description="Configure your payment gateway and donation preferences."
      />
      <DonationSettingsPanel />
    </div>
  );
}
