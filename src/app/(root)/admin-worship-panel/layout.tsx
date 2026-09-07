import { ClientRedirect } from "@/components/auth/client-redirect";
import { RequireAdmin } from "@/components/auth/require-admin";
import { resolvePlatformSuperAdminWorkspaceRedirect } from "@/lib/auth/redirect-platform-super-admin-from-workspace";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Admin Panel",
  "FaithConnectHub admin content management panel."
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdminRedirect = await resolvePlatformSuperAdminWorkspaceRedirect();
  if (superAdminRedirect) {
    return <ClientRedirect to={superAdminRedirect} />;
  }

  return <RequireAdmin>{children}</RequireAdmin>;
}
