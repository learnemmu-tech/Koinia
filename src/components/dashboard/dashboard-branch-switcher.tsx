"use client";



import { Building2, ChevronsUpDown, Church } from "lucide-react";

import { useRouter } from "next/navigation";



import { useActiveBranch } from "@/context/active-branch-context";

import { useOrganizationOptional } from "@/context/organization-context";

import { Button } from "@/components/ui/button";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuLabel,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";



type DashboardBranchSwitcherProps = {

  className?: string;

};



/** Church switcher for dashboard header — reloads workspace on change. */

export function DashboardBranchSwitcher({ className }: DashboardBranchSwitcherProps) {

  const router = useRouter();

  const organization = useOrganizationOptional();

  const { branches, activeBranch, setActiveBranchId, showBranchSwitcher } =

    useActiveBranch();



  if (!organization?.organization || !showBranchSwitcher) {

    return null;

  }



  return (

    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>

      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">

        {organization.organization.name}

      </span>

      <DropdownMenu>

        <DropdownMenuTrigger asChild>

          <Button

            type="button"

            variant="outline"

            className="h-9 max-w-xs justify-between gap-2 px-3 font-normal"

          >

            <span className="flex min-w-0 items-center gap-2">

              <Church className="size-3.5 shrink-0 text-muted-foreground" />

              <span className="truncate text-sm">

                {activeBranch?.name ?? "Select church"}

              </span>

            </span>

            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />

          </Button>

        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">

          <DropdownMenuLabel className="flex items-center gap-2">

            <Building2 className="size-3.5 opacity-60" />

            Switch church

          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {branches.map((branch) => (

            <DropdownMenuItem

              key={branch.id}

              className="cursor-pointer"

              onSelect={() => {

                setActiveBranchId(branch.id);

                router.refresh();

              }}

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

    </div>

  );

}

