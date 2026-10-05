"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { heritageDisplay, heritageSans } from "@/templates/heritage/fonts";
import { HeritagePrayerForm } from "@/templates/heritage/components/heritage-prayer-form";

export function HeritageSharePrayerDialog({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const t = useTranslations("heritage.prayer");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" className="heritage-btn heritage-btn-primary w-full sm:w-auto">
          {t("shareButton")}
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="heritage-dialog-overlay" />
        <DialogPrimitive.Content
          aria-describedby="heritage-share-prayer-desc"
          className={cn(
            heritageDisplay.variable,
            heritageSans.variable,
            "heritage-theme heritage-dialog-panel"
          )}
        >
          <DialogPrimitive.Close className="heritage-dialog-close" aria-label={tCommon("close")}>
            <X className="size-4" />
          </DialogPrimitive.Close>
          <header className="heritage-dialog-header">
            <DialogPrimitive.Title className="heritage-dialog-title">
              {t("shareTitle")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="heritage-share-prayer-desc"
              className="heritage-dialog-description"
            >
              {t("shareDescription")}
            </DialogPrimitive.Description>
          </header>
          {open ? (
            <HeritagePrayerForm
              model={model}
              variant="dialog"
              flush
              onCancel={() => setOpen(false)}
            />
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
