"use client";

import { useChurchManagementAccess } from "@/hooks/use-church-management-access";

/** True when the user can manage church content (admin sidebar / inline actions). */
export function useIsAdmin(): boolean {
  const { canAccessChurchManagement, loading } = useChurchManagementAccess();
  if (loading) return false;
  return canAccessChurchManagement;
}
