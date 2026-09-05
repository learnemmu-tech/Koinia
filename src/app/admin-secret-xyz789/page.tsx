"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

import type { FirebaseSong } from "@/types/firebase-song";

import { Button } from "@/components/ui/button";
import { AddMusicModal } from "@/components/admin/add-music-modal";
import { MusicList } from "@/components/admin/music-list";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import { useAdminSongs } from "@/hooks/use-admin-collections";

export default function AdminPage() {
  const adminChurchId = useAdminChurchId();
  const { data: songs, loading } = useAdminSongs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<FirebaseSong | null>(null);

  function handleAddMusic() {
    setSelectedSong(null);
    setIsModalOpen(true);
  }

  function handleEditSong(song: FirebaseSong) {
    setSelectedSong(song);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedSong(null);
  }

  function handleSongSaved() {
    handleCloseModal();
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
          /* Query refetch keeps songs current */
        }}
      />
    </div>
  );
}
