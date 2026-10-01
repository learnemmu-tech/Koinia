import { ClientRedirect } from "@/components/auth/client-redirect";
import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
import { resolvePlatformSuperAdminWorkspaceRedirect } from "@/lib/auth/redirect-platform-super-admin-from-workspace";
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
  const gateRedirect =
    (await resolvePlatformSuperAdminWorkspaceRedirect()) ??
    (await resolveDashboardLayoutDestination());
  if (gateRedirect) {
    return <ClientRedirect to={gateRedirect} />;
  }

  return <RequireWorkspaceAccess>{children}</RequireWorkspaceAccess>;
}
