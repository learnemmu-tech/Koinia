"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog, Compass, Home, Search, User2 } from "lucide-react";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "Browse", icon: Compass, href: "/browse" },
  { label: "Login", icon: User2, href: "/signin" },
  { label: "Settings", icon: Cog, href: "/settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { authUser } = useFirebaseAuth();

  const filteredNavItems = mobileNavItems.filter(({ label }) =>
    authUser ? label !== "Login" : label !== "Settings"
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-between border-t bg-background lg:hidden">
      {filteredNavItems.slice().map(({ label, icon: Icon, href }) => {
        const isActive = href === pathname;

        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex h-full w-1/4 flex-col items-center justify-center text-center text-muted-foreground duration-700 animate-in slide-in-from-bottom-full",
              isActive && "text-primary"
            )}
          >
            <Icon className="size-5" />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
