"use client";

import { DonationSettingsPanel } from "@/components/admin/donation-settings-panel";
import { adminSectionClass } from "@/lib/responsive-classes";

export function AdminDonationSettingsPageClient() {
  return (
    <div className={adminSectionClass}>
      <DonationSettingsPanel />
    </div>
  );
}
