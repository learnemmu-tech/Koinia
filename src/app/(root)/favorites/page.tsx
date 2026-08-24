import { RequireAuth } from "@/components/auth/require-auth";
import { FavoritesPageClient } from "@/components/favorites/favorites-page-client";

export const metadata = {
  title: "My Library",
  description: "Your saved songs, sermons, articles, and events",
};

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesPageClient />
    </RequireAuth>
  );
}
