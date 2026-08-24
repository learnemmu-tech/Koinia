"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AuthorAvatarProps = {
  name: string;
  imageUrl?: string;
  className?: string;
};

export function getAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export function AuthorAvatar({ name, imageUrl, className }: AuthorAvatarProps) {
  const initials = getAuthorInitials(name);
  const src = imageUrl?.trim();

  return (
    <Avatar className={cn("size-8", className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
