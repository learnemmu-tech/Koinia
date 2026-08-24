export type FavoriteItemType = "song" | "sermon" | "article" | "event";

export type FirebaseFavorite = {
  id: string;
  userId: string;
  itemId: string;
  itemType: FavoriteItemType;
  createdAt: number;
};

export type FavoriteToggleInput = {
  itemId: string;
  itemType: FavoriteItemType;
};
