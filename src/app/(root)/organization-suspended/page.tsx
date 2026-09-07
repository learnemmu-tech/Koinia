import { Ban } from "lucide-react";

import { OrganizationSuspendedActions } from "@/components/auth/organization-suspended-actions";
import { MembershipStatusPage } from "@/components/auth/membership-status-page";

export const metadata = {
  title: "Organization Access Suspended",
};

export default function OrganizationSuspendedPage() {
  return (
    <MembershipStatusPage
      icon={Ban}
      title="Organization Access Suspended"
      description="Your organization's access to FaithConnectHub is currently suspended. Please contact your organization administrator."
      tone="red"
      actions={<OrganizationSuspendedActions />}
    />
  );
}
