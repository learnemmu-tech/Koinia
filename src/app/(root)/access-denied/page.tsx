import { ShieldX } from "lucide-react";

import { MembershipStatusPage } from "@/components/auth/membership-status-page";

export const metadata = {
  title: "Access Denied",
};

export default function AccessDeniedPage() {
  return (
    <MembershipStatusPage
      icon={ShieldX}
      title="Access denied"
      description="Your membership request was not approved. Please contact your church administrator if you believe this is an error."
      tone="red"
    />
  );
}
