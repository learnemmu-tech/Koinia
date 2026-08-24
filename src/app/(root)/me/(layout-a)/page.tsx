import React from "react";
import { Plus } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { NewPlaylistForm } from "@/components/playlist/new-playlist-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Playlists",
  description: "Your playlists in one place.",
};

export default function MyPlaylistsPage() {
  return (
    <RequireAuth>
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            My Playlists
          </h2>
        </div>

        <div className="flex h-44 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-[25rem]">
          <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
            You don&apos;t have any playlist yet.
          </h3>

          <NewPlaylistForm>
            <Button>
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        </div>
      </div>
    </RequireAuth>
  );
}
