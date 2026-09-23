import type { ShortCategory } from "@/types/video-short";

export const CHURCH_VIDEO_PROVIDERS = [
  "youtube",
  "vimeo",
  "instagram",
] as const;

export type ChurchVideoProvider = (typeof CHURCH_VIDEO_PROVIDERS)[number];

export type ChurchVideo = {
  id: string;
  organizationId: string;
  churchId: string;
  title: string;
  description: string;
  externalUrl: string;
  provider: ChurchVideoProvider;
  thumbnailUrl: string | null;
  category: ShortCategory;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  canManage?: boolean;
};
