"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings2,
  Sun,
  User2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

export function useAccountMenuActions() {
  const { signOut } = useFirebaseAuth();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    }
  }

  return { handleSignOut };
}

type AccountMenuItemsProps = {
  onNavigate?: () => void;
};

export function AccountMenuItems({ onNavigate }: AccountMenuItemsProps) {
  const { setTheme } = useTheme();
  const { handleSignOut } = useAccountMenuActions();

  return (
    <>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/profile" onClick={onNavigate}>
          <User2 className="mr-2 size-4" />
          My Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/settings" onClick={onNavigate}>
          <Settings2 className="mr-2 size-4" />
          Account Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/settings/notifications" onClick={onNavigate}>
          <Bell className="mr-2 size-4" />
          Notification Preferences
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Palette className="mr-2 size-4" />
          Appearance
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/appearance" onClick={onNavigate}>
                Theme settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setTheme("light");
              }}
            >
              <Sun className="mr-2 size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setTheme("dark");
              }}
            >
              <Moon className="mr-2 size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setTheme("system");
              }}
            >
              <Monitor className="mr-2 size-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/about" onClick={onNavigate}>
          <CircleHelp className="mr-2 size-4" />
          Help
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          onNavigate?.();
          void handleSignOut();
        }}
        className="cursor-pointer"
      >
        <LogOut className="mr-2 size-4" />
        Sign Out
      </DropdownMenuItem>
    </>
  );
}
