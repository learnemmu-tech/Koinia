"use client";

import { Check, ChevronDown } from "lucide-react";
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
};

export function LocaleSwitcher({
  className,
  align = "end",
}: LocaleSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const { setLocale } = useLocaleSwitcher();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          className={cn(
            "h-8 gap-1 rounded-full px-2.5 text-xs font-medium sm:h-9",
            className
          )}
        >
          <span>{localeNativeNames[locale]}</span>
          <ChevronDown className="size-3.5 opacity-70" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[9rem] p-1">
        {locales.map((item) => {
          const selected = item === locale;
          return (
            <DropdownMenuItem
              key={item}
              className="cursor-pointer text-sm"
              onSelect={() => {
                if (!selected) setLocale(item);
              }}
            >
              <span className="flex-1">{localeNativeNames[item]}</span>
              {selected ?
                <Check className="size-3.5 text-foreground" aria-hidden />
              : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
