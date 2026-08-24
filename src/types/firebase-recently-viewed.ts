export type RecentlyViewedItemType = "song" | "sermon" | "article";

export type FirebaseRecentlyViewed = {
  id: string;
  userId: string;
  itemId: string;
  itemType: RecentlyViewedItemType;
  viewedAt: number;
};
