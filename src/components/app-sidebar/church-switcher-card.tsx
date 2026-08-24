"use client";

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
import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import {
  isIndependentChurchWorkspace,
  isMultiChurchOrgWorkspace,
} from "@/lib/organization/workspace-type";
import type { FirebaseOrganization } from "@/types/organization";
import { cn } from "@/lib/utils";

function workspaceTypeLabel(organization: FirebaseOrganization | null): string {
  if (!organization) return "Church Workspace";
  if (isMultiChurchOrgWorkspace(organization)) return "Multi-Church Organization";
  if (isIndependentChurchWorkspace(organization)) return "Independent Church";
  return "Church Workspace";
}

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
      <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-background">
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
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        "bg-primary/15 text-[11px] font-semibold text-sidebar-foreground"
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}

export function ChurchSwitcherCard() {
  const organizationCtx = useOrganizationOptional();
  const branchContext = useActiveBranchOptional();

  if (organizationCtx?.loading && !organizationCtx.organization) {
    return (
      <div className="m-2 rounded-lg bg-white/5 p-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
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
  const church = churches[0];
  const churchName =
    isMultiOrg ?
      organization.name?.trim() ||
      activeBranch?.name?.trim() ||
      church?.name?.trim() ||
      "Your organization"
    : activeBranch?.name?.trim() ||
      church?.name?.trim() ||
      organization.name?.trim() ||
      "Your church";
  const logoUrl =
    isMultiOrg ?
      organization.logo?.trim() ||
      church?.logoUrl?.trim()
    : church?.logoUrl?.trim() ||
      organization.logo?.trim();
  const subtitle = workspaceTypeLabel(organization);
  const showBranchSwitcher =
    branchContext?.showBranchSwitcher && branches.length > 1;

  const cardBody = (
    <>
      <WorkspaceAvatar name={churchName} logoUrl={logoUrl} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
          {churchName}
        </p>
        <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
          {subtitle}
        </p>
      </div>
      {showBranchSwitcher ?
        <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40" />
      : null}
    </>
  );

  if (showBranchSwitcher) {
    return (
      <div className="m-2 rounded-lg bg-white/5 p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 text-left focus-visible:outline-none"
            >
              {cardBody}
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
      </div>
    );
  }

  return (
    <div className="m-2 flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
      {cardBody}
    </div>
  );
}
