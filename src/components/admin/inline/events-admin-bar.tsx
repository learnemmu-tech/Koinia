"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";

const AddEventModal = dynamic(
  () => import("@/components/admin/add-event-modal").then((m) => m.AddEventModal),
  { ssr: false }
);

type EventsAdminBarProps = {
  contentScope?: "platform_public" | "organization";
};

export function EventsAdminBar({
  contentScope = "organization",
}: EventsAdminBarProps) {
  const t = useTranslations("events");
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const workspace = useWorkspaceTenantScope();
  const [open, setOpen] = useState(false);

  const effectiveScope =
    contentScope === "platform_public" && isSuperAdmin
      ? ("platform_public" as const)
      : ("organization" as const);

  const churchId =
    effectiveScope === "platform_public" ? "" : (workspace.churchId ?? "");

  if (!isAdmin) return null;
  if (effectiveScope === "organization" && !churchId) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0 gap-1.5 rounded-full"
      >
        <Plus className="size-4" aria-hidden />
        {t("add")}
      </Button>

      {open ? (
        <AddEventModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSave={() => setOpen(false)}
          churchId={churchId}
          contentScope={effectiveScope}
        />
      ) : null}
    </>
  );
}
