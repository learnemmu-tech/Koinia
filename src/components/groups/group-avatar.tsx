"use client";

import { UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function GroupAvatar({
  imageUrl,
  name,
  className,
}: {
  imageUrl: string | null | undefined;
  name: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-14 rounded-2xl", className)}>
      {imageUrl ?
        <AvatarImage src={imageUrl} alt="" className="object-cover" />
      : null}
      <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
        <UsersRound className="size-6" aria-hidden />
        <span className="sr-only">{name}</span>
      </AvatarFallback>
    </Avatar>
  );
}

export function groupRoleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}
