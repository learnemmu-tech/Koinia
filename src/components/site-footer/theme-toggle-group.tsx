"use client";

import React from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ThemeToggleGroupProps = {
  className?: string;
};

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme =
    (resolvedTheme ?? theme) === "dark" ? "dark" : "light";

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5",
          className
        )}
        aria-hidden="true"
      >
        <span className="inline-flex size-7 items-center justify-center sm:size-8">
          <SunMedium className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <span className="inline-flex size-7 items-center justify-center sm:size-8">
          <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5",
        className
      )}
      role="group"
      aria-label="Theme toggle"
    >
      <button
        type="button"
        aria-label="Light mode"
        aria-pressed={activeTheme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full transition-colors sm:size-8",
          activeTheme === "light" ?
            "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <SunMedium className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
      <button
        type="button"
        aria-label="Dark mode"
        aria-pressed={activeTheme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full transition-colors sm:size-8",
          activeTheme === "dark" ?
            "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}
