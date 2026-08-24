import { RequireAdmin } from "@/components/auth/require-admin";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Admin Panel",
  "FaithConnectHub admin content management panel."
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
