import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
export function SubscriptionPaymentEmail({
  organizationName,
  planName,
  amount,
  currency,
  billingInterval,
  paymentDate,
  paymentId,
  subscriptionId,
  status,
  nextBillingDate,
  invoiceUrl,
  billingUrl,
  recurring,
}: {
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  billingInterval: string;
  paymentDate: string;
  paymentId: string;
  subscriptionId?: string | null;
  status: string;
  nextBillingDate?: string | null;
  invoiceUrl?: string | null;
  billingUrl: string;
  recurring?: boolean;
}) {
  const rows: Array<[string, string]> = [
    ["Organization", organizationName],
    ["Plan", planName],
    ["Amount paid", amount],
    ["Currency", currency],
    ["Billing interval", billingInterval],
    ["Payment date", paymentDate],
    ["Payment ID", paymentId],
  ];
  if (subscriptionId) rows.push(["Subscription ID", subscriptionId]);
  rows.push(["Status", status]);
  if (nextBillingDate) rows.push(["Next billing date", nextBillingDate]);

  return (
    <EmailLayout
      preview={
        recurring
          ? "Your FaithConnectHub subscription payment was received"
          : "Your FaithConnectHub subscription is now active"
      }
      eyebrow="Billing"
      title="Payment Successful!"
    >
      <EmailText>
        {recurring
          ? "Thank you. We received a subscription payment for your church workspace."
          : "Thank you for choosing FaithConnectHub. Your subscription has been successfully activated, and your church workspace now has access to your selected plan."}
      </EmailText>
      <EmailFacts rows={rows} />
      <EmailButton href={billingUrl} label="View billing" />
      {invoiceUrl ?
        <EmailText>
          <a href={invoiceUrl}>View invoice</a>
        </EmailText>
      : null}
    </EmailLayout>
  );
}
