"use client";

import Link from "next/link";
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
import { useTranslations } from "next-intl";

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
  const ta = useTranslations("auth");

  async function handleSignOut() {
    try {
      await signOut();
      toast.success(ta("signedOut"));
    } catch {
      toast.error(ta("signOutFailed"));
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
  const tn = useTranslations("navigation");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");

  return (
    <>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/profile" onClick={onNavigate}>
          <User2 className="mr-2 size-4" />
          {tn("myProfile")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/settings" onClick={onNavigate}>
          <Settings2 className="mr-2 size-4" />
          {tn("accountSettings")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/settings/notifications" onClick={onNavigate}>
          <Bell className="mr-2 size-4" />
          {tn("notificationPreferences")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Palette className="mr-2 size-4" />
          {tc("appearance")}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/appearance" onClick={onNavigate}>
                {tn("themeSettings")}
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
              {tc("themeLight")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setTheme("dark");
              }}
            >
              <Moon className="mr-2 size-4" />
              {tc("themeDark")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setTheme("system");
              }}
            >
              <Monitor className="mr-2 size-4" />
              {tc("themeSystem")}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/about" onClick={onNavigate}>
          <CircleHelp className="mr-2 size-4" />
          {tc("help")}
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
        {ta("signOut")}
      </DropdownMenuItem>
    </>
  );
}
