"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clapperboard,
  CalendarDays,
  HandCoins,
  Loader2,
  Music,
  Newspaper,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  loadPlatformContentRecord,
  type PlatformContentRecord,
} from "@/lib/super-admin/platform-content-actions";
import type {
  PlatformContentRow,
  PlatformContentType,
} from "@/lib/super-admin/platform-content-queries";

import { PlatformShortEditDialog } from "./super-admin-platform-short-edit-dialog";

const AddMusicModal = dynamic(
  () => import("@/components/admin/add-music-modal").then((m) => m.AddMusicModal),
  { ssr: false }
);
const AddSermonModal = dynamic(
  () =>
    import("@/components/admin/add-sermon-modal").then((m) => m.AddSermonModal),
  { ssr: false }
);
const AddArticleModal = dynamic(
  () =>
    import("@/components/admin/add-article-modal").then((m) => m.AddArticleModal),
  { ssr: false }
);
const AddEventModal = dynamic(
  () => import("@/components/admin/add-event-modal").then((m) => m.AddEventModal),
  { ssr: false }
);
const AddDonationCampaignModal = dynamic(
  () =>
    import("@/components/admin/add-donation-campaign-modal").then(
      (m) => m.AddDonationCampaignModal
    ),
  { ssr: false }
);
const CreateShortSheet = dynamic(
  () =>
    import("@/components/shorts/create-short-sheet").then(
      (m) => m.CreateShortSheet
    ),
  { ssr: false }
);

/**
 * Platform content is owned by FaithConnectHub itself, so every reused form is
 * mounted with the platform scope and no tenant identifiers.
 */
const PLATFORM_SCOPE = "platform_public" as const;
const NO_CHURCH = "";

const CREATE_OPTIONS: {
  type: PlatformContentType;
  label: string;
  icon: typeof Music;
}[] = [
  { type: "songs", label: "Song", icon: Music },
  { type: "sermons", label: "Sermon", icon: BookOpen },
  { type: "articles", label: "Article", icon: Newspaper },
  { type: "shorts", label: "Short", icon: Clapperboard },
  { type: "events", label: "Event", icon: CalendarDays },
  { type: "donations", label: "Donation campaign", icon: HandCoins },
];

function useShortsToken() {
  const { user } = useFirebaseAuth();
  return useCallback(
    async (forceRefresh = false) => {
      if (!user) return null;
      return user.getIdToken(forceRefresh);
    },
    [user]
  );
}

/** Renders the existing create/edit form for one content type. */
function PlatformContentForm({
  type,
  loaded,
  onClose,
  onSaved,
}: {
  type: PlatformContentType;
  loaded: PlatformContentRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const getToken = useShortsToken();

  const shared = {
    isOpen: true as const,
    onClose,
    onSave: onSaved,
    churchId: NO_CHURCH,
    contentScope: PLATFORM_SCOPE,
  };

  if (type === "songs") {
    return (
      <AddMusicModal
        {...shared}
        initialSong={loaded?.type === "songs" ? loaded.record : null}
      />
    );
  }
  if (type === "sermons") {
    return (
      <AddSermonModal
        {...shared}
        initialSermon={loaded?.type === "sermons" ? loaded.record : null}
      />
    );
  }
  if (type === "articles") {
    return (
      <AddArticleModal
        {...shared}
        initialArticle={loaded?.type === "articles" ? loaded.record : null}
      />
    );
  }
  if (type === "events") {
    return (
      <AddEventModal
        {...shared}
        initialEvent={loaded?.type === "events" ? loaded.record : null}
      />
    );
  }
  if (type === "donations") {
    return (
      <AddDonationCampaignModal
        {...shared}
        initialCampaign={loaded?.type === "donations" ? loaded.record : null}
      />
    );
  }

  // Shorts need a video upload to create, and only metadata to edit.
  if (loaded?.type === "shorts") {
    return (
      <PlatformShortEditDialog
        short={loaded.record}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <CreateShortSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      getToken={getToken}
      onPublished={onSaved}
      contentScope={PLATFORM_SCOPE}
      churchId={NO_CHURCH}
    />
  );
}

/** Loads the full record for a row, then opens the matching edit form. */
export function PlatformContentEditors({
  editRow,
  onClose,
  onSaved,
}: {
  editRow: PlatformContentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loaded, setLoaded] = useState<PlatformContentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // Callers pass inline handlers, so the fetch effect keys off the row identity
  // only and reads the latest callback through a ref.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const editType = editRow?.type ?? null;
  const editId = editRow?.id ?? null;

  useEffect(() => {
    if (!editType || !editId) {
      setLoaded(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoaded(null);

    void (async () => {
      try {
        const record = await loadPlatformContentRecord(editType, editId);
        if (!active) return;
        if (!record) {
          toast.error("This platform content could not be loaded.");
          onCloseRef.current();
          return;
        }
        setLoaded(record);
      } catch {
        if (active) {
          toast.error("This platform content could not be loaded.");
          onCloseRef.current();
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [editType, editId]);

  if (!editRow) return null;

  if (loading || !loaded) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading content…</span>
      </div>
    );
  }

  return (
    <PlatformContentForm
      type={editRow.type}
      loaded={loaded}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

/** Header action: pick a content type and open its create form. */
export function PlatformContentCreateMenu() {
  const router = useRouter();
  const [createType, setCreateType] = useState<PlatformContentType | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="size-4" />
            New platform content
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Create for the public site</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CREATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.type}
                onSelect={() => setCreateType(option.type)}
              >
                <Icon className="size-4" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {createType ? (
        <PlatformContentForm
          type={createType}
          loaded={null}
          onClose={() => setCreateType(null)}
          onSaved={() => {
            setCreateType(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
