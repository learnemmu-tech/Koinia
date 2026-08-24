import { FirebaseSongCard, songsAlbumGridClassName } from "@/components/music/firebase-song-card";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getAllSongs } from "@/lib/firebase-queries";

export async function FirebaseTopSongs() {
  const { scope } = await getPageTenantContext();
  const songs = await getAllSongs(scope);
  const preview = songs.slice(0, 12);

  if (preview.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No songs in your library yet. Add music from the admin panel.
      </p>
    );
  }

  return (
    <>
      <p className="font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        Your Library
      </p>

      <div className={songsAlbumGridClassName}>
        {preview.map((song) => (
          <FirebaseSongCard key={song.id} song={song} />
        ))}
      </div>
    </>
  );
}
