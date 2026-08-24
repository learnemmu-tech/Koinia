import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Dashboard",
  "FaithConnectHub church workspace and ministry management."
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireWorkspaceAccess>{children}</RequireWorkspaceAccess>;
}
