"use client";

import Link from "next/link";
import { Building2, ChevronsUpDown } from "lucide-react";

import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}

function hasCustomLogo(logoUrl: string | undefined): boolean {
  const value = logoUrl?.trim();
  if (!value) return false;
  return value !== DEFAULT_CHURCH_LOGO;
}

function WorkspaceAvatar({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  if (hasCustomLogo(logoUrl)) {
    return (
      <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-[#111111]">
        <ImageWithFallback
          src={logoUrl!}
          fallback={DEFAULT_CHURCH_LOGO}
          alt=""
          width={32}
          height={32}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        "bg-[#1A1A1A] text-[10px] font-semibold text-[#A1A1A1]"
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

export function SidebarWorkspaceHeader() {
  const organizationCtx = useOrganizationOptional();
  const branchContext = useActiveBranchOptional();
  const { profile } = useFirebaseAuth();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  if (organizationCtx?.loading && !organizationCtx.organization) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <Skeleton className="h-3.5 w-28" />
      </div>
    );
  }

  if (!organizationCtx?.organization) {
    return null;
  }

  const { organization, churches } = organizationCtx;
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);
  const branches = branchContext?.branches ?? [];
  const activeBranch =
    branchContext?.activeBranch ??
    branches.find((b) => b.isDefault) ??
    branches[0] ??
    null;
  const preferredChurchId =
    profile?.churchId?.trim() ||
    profile?.activeBranchId?.trim() ||
    profile?.pendingBranchId?.trim() ||
    "";
  const church =
    churches.find((item) => item.id === preferredChurchId) ??
    churches.find((item) => item.id === activeBranch?.id) ??
    churches[0];
  const churchName =
    isMultiOrg
      ? organization.name?.trim() ||
        activeBranch?.name?.trim() ||
        church?.name?.trim() ||
        "Your organization"
      : activeBranch?.name?.trim() ||
        church?.name?.trim() ||
        organization.name?.trim() ||
        "Your church";
  const logoUrl = isMultiOrg
    ? organization.logo?.trim() || church?.logoUrl?.trim()
    : church?.logoUrl?.trim() || organization.logo?.trim();
  const showBranchSwitcher =
    branchContext?.showBranchSwitcher && branches.length > 1;

  const identity = (
    <>
      <WorkspaceAvatar name={churchName} logoUrl={logoUrl} />
      {!isCollapsed ?
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">
          {churchName}
        </span>
      : null}
    </>
  );

  if (showBranchSwitcher) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={isCollapsed ? churchName : undefined}
            className={cn(
              "flex min-w-0 w-full items-center gap-2 text-left focus-visible:outline-none",
              isCollapsed && "justify-center"
            )}
          >
            {identity}
            {!isCollapsed ?
              <ChevronsUpDown className="size-4 shrink-0 text-[#6B7280]" />
            : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Switch church</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => branchContext?.setActiveBranchId(branch.id)}
            >
              <Building2 className="mr-2 size-4 opacity-60" />
              <span className="truncate">{branch.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      href="/"
      title={isCollapsed ? churchName : undefined}
      className={cn(
        "flex min-w-0 w-full items-center gap-2",
        isCollapsed && "justify-center"
      )}
    >
      {identity}
    </Link>
  );
}
