"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  localeNativeNames,
  locales,
  type Locale,
} from "@/i18n/config";
import { useLocaleSwitcher } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  className?: string;
  align?: "start" | "center" | "end";
  display?: "name" | "code";
  iconOnly?: boolean;
  menuClassName?: string;
};

export function LocaleSwitcher({
  className,
  align = "end",
  display = "name",
  iconOnly = false,
  menuClassName,
}: LocaleSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const { setLocale } = useLocaleSwitcher();
  const currentLabel =
    display === "code" ? locale.toUpperCase() : localeNativeNames[locale];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`${t("language")}: ${currentLabel}`}
          aria-haspopup="menu"
          className={cn(
            "h-9 gap-1.5 rounded-full border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-none",
            "hover:bg-surface-raised hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "dark:bg-background dark:text-foreground dark:hover:bg-accent dark:hover:text-foreground",
            "sm:h-9 sm:px-3",
            className
          )}
        >
          <Globe className={cn("shrink-0", iconOnly ? "size-4" : "size-3.5 opacity-80")} aria-hidden />
          {iconOnly ? null : (
            <span className="hidden max-w-[7rem] truncate min-[360px]:inline">
              {currentLabel}
            </span>
          )}
          {iconOnly ? null : <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          "min-w-[10rem] border-border bg-card p-1 text-foreground shadow-dropdown dark:bg-popover dark:shadow-md",
          menuClassName
        )}
      >
        {locales.map((item) => {
          const selected = item === locale;
          return (
            <DropdownMenuItem
              key={item}
              className={cn(
                "cursor-pointer rounded-md text-sm",
                menuClassName
                  ? "parish-locale-item"
                  : "focus:bg-surface-raised focus:text-foreground dark:focus:bg-accent",
                selected && (menuClassName ? "is-selected" : "bg-primary-subtle text-foreground")
              )}
              onSelect={() => {
                if (!selected) setLocale(item);
              }}
            >
              <span className="flex-1">{localeNativeNames[item]}</span>
              {selected ?
                <Check className="size-3.5 text-primary" aria-hidden />
              : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
