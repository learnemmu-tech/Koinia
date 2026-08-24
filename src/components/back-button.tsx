"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
  className?: string;
};

export function BackButton({
  label = "Back",
  fallbackHref = "/",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        "h-9 gap-1.5 px-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}
