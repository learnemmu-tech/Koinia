"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";

const AddEventModal = dynamic(
  () => import("@/components/admin/add-event-modal").then((m) => m.AddEventModal),
  { ssr: false }
);

export function EventsAdminBar({ churchId }: { churchId: string }) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0 gap-1.5 rounded-full"
      >
        <Plus className="size-4" aria-hidden />
        Create Event
      </Button>

      {open ? (
        <AddEventModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSave={() => setOpen(false)}
          churchId={churchId}
        />
      ) : null}
    </>
  );
}
