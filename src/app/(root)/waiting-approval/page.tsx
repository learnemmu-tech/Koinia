import { WaitingApprovalClient } from "@/components/join/waiting-approval-client";

export const metadata = {
  title: "Waiting for approval",
  description: "Your church membership request is pending administrator approval.",
};

export default function WaitingApprovalPage() {
  return <WaitingApprovalClient />;
}
