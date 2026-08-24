import { UserMinus } from "lucide-react";

import { MembershipStatusPage } from "@/components/auth/membership-status-page";

export const metadata = {
  title: "Membership Removed",
};

export default function MembershipRemovedPage() {
  return (
    <MembershipStatusPage
      icon={UserMinus}
      title="Membership removed"
      description="Your membership has been removed. Please contact your church administrator if you believe this is an error."
      tone="amber"
    />
  );
}
