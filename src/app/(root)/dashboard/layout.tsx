import { ClientRedirect } from "@/components/auth/client-redirect";
import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
import { resolvePlatformSuperAdminWorkspaceRedirect } from "@/lib/auth/redirect-platform-super-admin-from-workspace";
import { requireOnboardingCompleteOrRedirect } from "@/lib/auth/require-onboarding-complete-server";
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
  const superAdminRedirect = await resolvePlatformSuperAdminWorkspaceRedirect();
  if (superAdminRedirect) {
    return <ClientRedirect to={superAdminRedirect} />;
  }

  await requireOnboardingCompleteOrRedirect();
  return <RequireWorkspaceAccess>{children}</RequireWorkspaceAccess>;
}
