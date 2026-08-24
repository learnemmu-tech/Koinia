/** Local library types (playlists/favorites UI — not yet backed by Firestore). */

export type MyPlaylist = {
  id: string;
  name: string;
  description: string | null;
  songs: string[];
  userId: string;
  createdAt: Date | null;
};

export type Favorite = {
  userId: string;
  songs: string[];
  albums: string[];
  playlists: string[];
  artists: string[];
  podcasts: string[];
};
