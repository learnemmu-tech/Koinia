"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";

const AddMusicModal = dynamic(
  () => import("@/components/admin/add-music-modal").then((m) => m.AddMusicModal),
  { ssr: false }
);

export function SongsAdminBar({ churchId }: { churchId: string }) {
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
        Add Song
      </Button>

      {open ? (
        <AddMusicModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSave={() => setOpen(false)}
          churchId={churchId}
        />
      ) : null}
    </>
  );
}
