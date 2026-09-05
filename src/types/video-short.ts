export const SHORT_CATEGORIES = [
  "Worship",
  "Sermon",
  "Prayer",
  "Bible",
  "Testimony",
  "Encouragement",
  "Church Life",
  "Events",
  "Other",
] as const;

export type ShortCategory = (typeof SHORT_CATEGORIES)[number];

export type ShortVisibility = "church" | "public";

export type VideoShortCreator = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoUrl: string | null;
};

export type VideoShort = {
  id: string;
  organizationId: string;
  churchId: string;
  userId: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string;
  category: ShortCategory;
  duration: number | null;
  visibility: ShortVisibility;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  creator: VideoShortCreator;
  churchName: string;
  likedByMe?: boolean;
  canManage?: boolean;
};

export type VideoShortComment = {
  id: string;
  shortId: string;
  userId: string;
  body: string;
  createdAt: string;
  creator: VideoShortCreator;
};

export type ShortsFeedFilter = "church" | "latest";

export const MAX_SHORT_DURATION_SECONDS = 90;

/** Max uploaded file size (Supabase Free bucket limit). */
export const MAX_SHORT_VIDEO_BYTES = 50 * 1024 * 1024;

/** Compress in the browser when the source exceeds this size. */
export const SHORT_VIDEO_COMPRESS_THRESHOLD_BYTES = 48 * 1024 * 1024;

/** Target size after compression (slightly under 50 MB). */
export const SHORT_VIDEO_UPLOAD_TARGET_BYTES = 48 * 1024 * 1024;

/** Largest source file users may pick before compression. */
export const MAX_SHORT_SOURCE_VIDEO_BYTES = 400 * 1024 * 1024;

export const MAX_SHORT_THUMBNAIL_BYTES = 2 * 1024 * 1024;
