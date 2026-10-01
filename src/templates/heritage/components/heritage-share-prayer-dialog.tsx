"use client";

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
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" className="heritage-btn heritage-btn-primary w-full sm:w-auto">
          Share a Request
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
          <DialogPrimitive.Close className="heritage-dialog-close" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
          <header className="heritage-dialog-header">
            <DialogPrimitive.Title className="heritage-dialog-title">
              Share a request
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="heritage-share-prayer-desc"
              className="heritage-dialog-description"
            >
              Every request is sent to the church leaders. Choose whether it may
              also appear on this wall once they approve it. It is not published
              until then.
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
