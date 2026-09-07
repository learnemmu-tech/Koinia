"use client";

import Link from "next/link";

import { AuthLoading } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { useChurchManagementAccess } from "@/hooks/use-church-management-access";

export function RequireOrganizationAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, canManageOrganization } = useChurchManagementAccess();

  if (loading) return <AuthLoading />;

  if (!canManageOrganization) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">
          Organization Admin required
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Only an Organization Admin can manage billing, organization settings,
          and church settings.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
