import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
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
  await requireOnboardingCompleteOrRedirect();
  return <RequireWorkspaceAccess>{children}</RequireWorkspaceAccess>;
}
