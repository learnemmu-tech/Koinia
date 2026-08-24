"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  FavoriteItemType,
  FirebaseFavorite,
} from "@/types/firebase-favorite";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { addFavorite, removeFavorite } from "@/lib/favorite-mutations";
import { getFavoriteLookupKey } from "@/lib/favorite-firestore";
import { fetchUserFavorites } from "@/lib/favorite-queries";
import {
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

type FavoritesContextValue = {
  favorites: FirebaseFavorite[];
  loading: boolean;
  isFavorited: (itemType: FavoriteItemType, itemId: string) => boolean;
  toggleFavorite: (
    itemType: FavoriteItemType,
    itemId: string
  ) => Promise<void>;
};

const FavoritesContext = React.createContext<FavoritesContextValue | null>(
  null
);

export function FavoritesProvider({ children }: React.PropsWithChildren) {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["user-favorites", user?.uid],
    enabled: Boolean(user?.uid),
    queryFn: () => fetchUserFavorites(user!.uid),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const favoriteKeys = React.useMemo(
    () =>
      new Set(
        favorites.map((favorite) =>
          getFavoriteLookupKey(favorite.itemType, favorite.itemId)
        )
      ),
    [favorites]
  );

  const isFavorited = React.useCallback(
    (itemType: FavoriteItemType, itemId: string) =>
      favoriteKeys.has(getFavoriteLookupKey(itemType, itemId)),
    [favoriteKeys]
  );

  const toggleFavorite = React.useCallback(
    async (itemType: FavoriteItemType, itemId: string) => {
      if (!user?.uid) return;

      const trimmedId = itemId.trim();
      if (!trimmedId) return;

      if (isFavorited(itemType, trimmedId)) {
        await removeFavorite(user.uid, itemType, trimmedId);
        await queryClient.invalidateQueries({
          queryKey: ["user-favorites", user.uid],
        });
        return;
      }

      await addFavorite(user.uid, itemType, trimmedId);
      await queryClient.invalidateQueries({
        queryKey: ["user-favorites", user.uid],
      });
    },
    [user?.uid, isFavorited, queryClient]
  );

  const value = React.useMemo(
    () => ({
      favorites,
      loading: isLoading,
      isFavorited,
      toggleFavorite,
    }),
    [favorites, isLoading, isFavorited, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = React.useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
