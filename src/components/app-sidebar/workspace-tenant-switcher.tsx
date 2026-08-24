"use client";

import { Building2, ChevronsUpDown, Church } from "lucide-react";

import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useOrganizationOptional } from "@/context/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function WorkspaceTenantSwitcher() {
  const organization = useOrganizationOptional();
  const branchContext = useActiveBranchOptional();

  if (!organization?.organization) {
    return null;
  }

  const branches = branchContext?.branches ?? [];
  const activeBranch =
    branchContext?.activeBranch ??
    branches.find((b) => b.isDefault) ??
    branches[0] ??
    null;
  const showChurchSwitcher =
    branchContext?.showBranchSwitcher && branches.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {organization.organization.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {activeBranch?.name ?? "Organization"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {showChurchSwitcher ?
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="h-8">
                <Church className="size-4" />
                <span className="truncate">
                  {activeBranch?.name ?? "Select church"}
                </span>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel>Switch church</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => branchContext?.setActiveBranchId(branch.id)}
                >
                  <Church className="mr-2 size-4 opacity-60" />
                  <span className="truncate">{branch.name}</span>
                  {branch.isDefault ?
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Primary
                    </span>
                  : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      : null}
    </SidebarMenu>
  );
}
