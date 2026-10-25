import { ClientRedirect } from "@/components/auth/client-redirect";
import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
import { resolveDashboardLayoutDestination } from "@/lib/auth/require-onboarding-complete-server";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Dashboard",
  "FaithConnectHub church workspace and ministry management."
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Super-admin redirect is already decided inside this function. A separate
  // lookup here waited on the same user row before the rest of the gate.
  const gateRedirect = await resolveDashboardLayoutDestination();
  if (gateRedirect) {
    return <ClientRedirect to={gateRedirect} />;
  }

  return <RequireWorkspaceAccess>{children}</RequireWorkspaceAccess>;
}
