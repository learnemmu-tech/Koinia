import type { ReactNode } from "react";

import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "SuperAdmin",
  "FaithConnectHub platform administration console."
);

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformSuperAdmin();
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
