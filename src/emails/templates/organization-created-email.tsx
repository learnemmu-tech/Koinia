import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function OrganizationCreatedEmail({
  userName,
  organizationName,
  churchName,
  organizationId,
}: {
  userName: string;
  organizationName: string;
  churchName?: string;
  organizationId: string;
}) {
  return (
    <EmailLayout
      preview={`${organizationName} is ready on ${emailConfig.appName}`}
      eyebrow="Workspace ready"
      title="Your organization is ready"
    >
      <EmailText>Hi {userName}, {organizationName} has been created and is ready for you to set up.</EmailText>
      <EmailFacts
        rows={[
          ["Organization", organizationName],
          ["Church", churchName],
        ]}
      />
      <EmailNote>
        Finish your workspace, invite the people who will serve with you, and publish the first pieces your community should see.
      </EmailNote>
      <EmailButton
        href={`${emailConfig.appUrl}/dashboard?organizationId=${encodeURIComponent(organizationId)}`}
        label="Open your workspace"
      />
    </EmailLayout>
  );
}
