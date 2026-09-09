"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";

const AddDonationCampaignModal = dynamic(
  () =>
    import("@/components/admin/add-donation-campaign-modal").then(
      (m) => m.AddDonationCampaignModal
    ),
  { ssr: false }
);

type DonationsAdminBarProps = {
  contentScope?: "platform_public" | "organization";
};

export function DonationsAdminBar({
  contentScope = "organization",
}: DonationsAdminBarProps) {
  const t = useTranslations("donations");
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
        <AddDonationCampaignModal
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
