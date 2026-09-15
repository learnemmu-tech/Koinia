import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type OrganizationCreatedEmailProps = {
  userName: string;
  organizationName: string;
  churchName?: string;
  organizationId: string;
};

export function OrganizationCreatedEmail({
  userName,
  organizationName,
  churchName,
  organizationId,
}: OrganizationCreatedEmailProps) {
  return (
    <EmailLayout
      preview={`${organizationName} is ready on ${emailConfig.appName}`}
      title="Your organization is ready"
    >
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}>
        Hi {userName}, your FaithConnectHub workspace has been created successfully.
      </Text>
      <Text className="email-text" style={{ fontSize: "14px", lineHeight: "1.7", color: "#3d3545", margin: "0 0 20px" }}>
        <strong>Organization:</strong> {organizationName}
        {churchName ? <><br /><strong>Church:</strong> {churchName}</> : null}
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0 0 20px" }}>
        Your next step is to finish your workspace setup and invite the people who will help serve your community.
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/dashboard?organizationId=${encodeURIComponent(organizationId)}`}
        label="Open your workspace"
      />
    </EmailLayout>
  );
}
