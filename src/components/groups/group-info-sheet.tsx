"use client";

import type { ChurchGroupDetail } from "@/types/church-group";
import { GroupAvatar } from "@/components/groups/group-avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type GroupInfoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ChurchGroupDetail;
};

export function GroupInfoSheet({ open, onOpenChange, group }: GroupInfoSheetProps) {
  const createdLabel = new Date(group.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Group info</SheetTitle>
          <SheetDescription>{group.churchName}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex items-start gap-4">
            <GroupAvatar
              imageUrl={group.imageUrl}
              name={group.name}
              className="size-16 rounded-2xl"
            />
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-lg font-semibold">{group.name}</p>
              <p className="text-sm text-muted-foreground">
                {group.memberCount}{" "}
                {group.memberCount === 1 ? "member" : "members"}
              </p>
              <p className="text-sm text-muted-foreground">
                Created by {group.createdByName}
              </p>
              <p className="text-sm text-muted-foreground">Created {createdLabel}</p>
            </div>
          </div>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">About</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {group.description || "No description yet."}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
