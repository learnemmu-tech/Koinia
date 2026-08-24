"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";

const AddSermonModal = dynamic(
  () => import("@/components/admin/add-sermon-modal").then((m) => m.AddSermonModal),
  { ssr: false }
);

export function SermonsAdminBar({ churchId }: { churchId: string }) {
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
        Add Sermon
      </Button>

      {open ? (
        <AddSermonModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSave={() => setOpen(false)}
          churchId={churchId}
        />
      ) : null}
    </>
  );
}
