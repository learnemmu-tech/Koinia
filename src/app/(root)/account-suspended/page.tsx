import { Ban } from "lucide-react";

import { MembershipStatusPage } from "@/components/auth/membership-status-page";

export const metadata = {
  title: "Account Suspended",
};

export default function AccountSuspendedPage() {
  return (
    <MembershipStatusPage
      icon={Ban}
      title="Account suspended"
      description="Your account has been suspended. Please contact your church administrator for assistance."
      tone="red"
    />
  );
}
