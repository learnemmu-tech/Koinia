"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { collection, onSnapshot, orderBy } from "firebase/firestore";

import type { FirebaseSong } from "@/types/firebase-song";

import { Button } from "@/components/ui/button";
import { AddMusicModal } from "@/components/admin/add-music-modal";
import { MusicList } from "@/components/admin/music-list";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import { buildClientScopedQuery } from "@/lib/church-query-builder";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { normalizeSongFromFirestore } from "@/lib/song-firestore";
import { db } from "@/lib/firebase";

export default function AdminPage() {
  const adminChurchId = useAdminChurchId();
  const [songs, setSongs] = useState<FirebaseSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<FirebaseSong | null>(null);

  useEffect(() => {
    if (MULTI_CHURCH_ENABLED && !adminChurchId) {
      setSongs([]);
      setLoading(false);
      return;
    }

    const songsQuery = buildClientScopedQuery(
      collection(db, "songs"),
      adminChurchId,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      songsQuery,
      (snapshot) => {
        setSongs(
          snapshot.docs.map((doc) =>
            normalizeSongFromFirestore(doc.id, doc.data())
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error("[AdminPage] Firestore snapshot failed:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [adminChurchId]);

  function handleAddMusic() {    setSelectedSong(null);
    setIsModalOpen(true);
  }

  function handleEditSong(song: FirebaseSong) {    setSelectedSong(song);
    setIsModalOpen(true);
  }

  function handleCloseModal() {    setIsModalOpen(false);
    setSelectedSong(null);
  }

  function handleSongSaved() {    handleCloseModal();
  }

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Music Admin</h1>
          <p className="mt-2 text-muted-foreground">
            Manage songs, uploads, and lyrics
          </p>
        </div>

        <Button size="lg" onClick={handleAddMusic} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Music
        </Button>
      </div>

      <AddMusicModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSongSaved}
        initialSong={selectedSong}
        churchId={adminChurchId ?? ""}
      />

      <MusicList
        songs={songs}
        loading={loading}
        onEdit={handleEditSong}
        onDelete={() => {
          /* Real-time snapshot keeps songs current */
        }}
      />
    </div>
  );
}
