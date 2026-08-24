"use client";

import Image from "next/image";
import Link from "next/link";
import { Cog, LogOut, Monitor, Moon, Sun, SunMoon, User2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function UserDropdown() {
  const { authUser, profile, signOut } = useFirebaseAuth();
  const { setTheme } = useTheme();

  const displayName =
    profile ?
      `${profile.firstName} ${profile.lastName}`.trim()
    : authUser?.displayName ?? "Guest User";

  async function signOutHandler() {
    try {
      await signOut();
      toast.success("You have been signed out.");
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="border shadow-sm">
          <AvatarImage
            src={authUser?.photoURL ?? undefined}
            alt={displayName}
          />
          <AvatarFallback asChild>
            <Image
              src="/images/placeholder/user.jpg"
              alt={displayName}
              fill
              className="dark:invert"
            />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        className="max-w-[300px] *:cursor-pointer"
      >
        <DropdownMenuLabel className="flex flex-col">
          <span title={displayName} className="truncate">
            {authUser ? displayName : "Guest User"}
          </span>
          <span
            title={authUser?.email ?? undefined}
            className="truncate text-sm font-normal text-muted-foreground"
          >
            {authUser?.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={!authUser} asChild>
          <Link href="/me">
            <User2 size={16} className="mr-2" />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Cog size={16} className="mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon size={16} className="mr-2" />
            Theme
          </DropdownMenuSubTrigger>

          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="cursor-pointer"
              >
                <Sun size={16} className="mr-2" />
                Light
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="cursor-pointer"
              >
                <Moon size={16} className="mr-2" />
                Dark
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="cursor-pointer"
              >
                <Monitor size={16} className="mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {authUser && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOutHandler}>
              <LogOut size={16} className="mr-2" />
              Log Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
