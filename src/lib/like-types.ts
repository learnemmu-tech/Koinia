export const LIKE_ITEM_TYPES = [
  "song",
  "sermon",
  "article",
  "book",
  "video",
] as const;

export type LikeItemType = (typeof LIKE_ITEM_TYPES)[number];
