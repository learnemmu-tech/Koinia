"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { AdminQuickEditButton } from "@/components/admin/admin-quick-edit-button";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

const AddMusicModal = dynamic(
  () => import("@/components/admin/add-music-modal").then((m) => m.AddMusicModal),
  { ssr: false }
);

const AddSermonModal = dynamic(
  () => import("@/components/admin/add-sermon-modal").then((m) => m.AddSermonModal),
  { ssr: false }
);

const AddArticleModal = dynamic(
  () => import("@/components/admin/add-article-modal").then((m) => m.AddArticleModal),
  { ssr: false }
);

type PlatformContentQuickEditProps = {
  label: string;
  className?: string;
  /** Workspace edit route used by tenant admins. */
  tenantEditHref: string;
} & (
  | { kind: "song"; record: FirebaseSong }
  | { kind: "sermon"; record: FirebaseSermon }
  | { kind: "article"; record: FirebaseArticle }
);

/**
 * Tenant admins edit content in their workspace route. Platform SuperAdmins have
 * no tenant workspace, so `platform_public` records are edited in place on the
 * showcase page rather than navigating into /dashboard/content.
 */
export function PlatformContentQuickEdit(props: PlatformContentQuickEditProps) {
  const { label, className, tenantEditHref } = props;
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const [open, setOpen] = useState(false);

  const editsPlatformContent =
    isSuperAdmin && props.record.contentScope === "platform_public";

  if (!editsPlatformContent) {
    return (
      <AdminQuickEditButton
        href={tenantEditHref}
        label={label}
        className={className}
      />
    );
  }

  const close = () => setOpen(false);

  return (
    <>
      <AdminQuickEditButton
        onSelect={() => setOpen(true)}
        label={label}
        className={className}
      />

      {open && props.kind === "song" ?
        <AddMusicModal
          isOpen
          onClose={close}
          onSave={close}
          initialSong={props.record}
          churchId=""
          contentScope="platform_public"
        />
      : null}

      {open && props.kind === "sermon" ?
        <AddSermonModal
          isOpen
          onClose={close}
          onSave={close}
          initialSermon={props.record}
          churchId=""
          contentScope="platform_public"
        />
      : null}

      {open && props.kind === "article" ?
        <AddArticleModal
          isOpen
          onClose={close}
          onSave={close}
          initialArticle={props.record}
          churchId=""
          contentScope="platform_public"
        />
      : null}
    </>
  );
}
