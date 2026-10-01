"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  User2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  localeNativeNames,
  locales,
  type Locale,
} from "@/i18n/config";
import { useLocaleSwitcher } from "@/i18n/provider";

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
  chatHref?: string;
  shepherdHref?: string;
  prayerHref?: string;
};

export function AccountMenuItems({
  onNavigate,
}: AccountMenuItemsProps) {
  const { setTheme } = useTheme();
  const { handleSignOut } = useAccountMenuActions();
  const locale = useLocale() as Locale;
  const { setLocale } = useLocaleSwitcher();
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
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Globe className="mr-2 size-4" />
          {tc("language")}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent collisionPadding={8}>
            {locales.map((item) => {
              const selected = item === locale;
              return (
                <DropdownMenuItem
                  key={item}
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault();
                    if (!selected) setLocale(item);
                  }}
                >
                  <span className="flex-1">{localeNativeNames[item]}</span>
                  {selected ? (
                    <Check className="size-3.5 text-primary" aria-hidden />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
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
          <DropdownMenuSubContent collisionPadding={8}>
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
