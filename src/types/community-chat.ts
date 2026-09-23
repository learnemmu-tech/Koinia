export const COMMUNITY_MESSAGE_MAX_LENGTH = 2000;
export const COMMUNITY_MESSAGE_PAGE_SIZE = 50;

export const COMMUNITY_REACTION_TYPES = [
  "thumbs_up",
  "heart",
  "pray",
  "laugh",
  "celebrate",
  "sad",
] as const;

export type CommunityReactionType = (typeof COMMUNITY_REACTION_TYPES)[number];

export const COMMUNITY_REACTION_EMOJI: Record<CommunityReactionType, string> = {
  thumbs_up: "👍",
  heart: "❤️",
  pray: "🙏",
  laugh: "😂",
  celebrate: "🎉",
  sad: "😢",
};

export const COMMUNITY_REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Inappropriate content",
  "Other",
] as const;

export type CommunityReportReason = (typeof COMMUNITY_REPORT_REASONS)[number];

export type CommunityChatReactionSummary = {
  type: CommunityReactionType;
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type CommunityChatReplyPreview = {
  id: string;
  authorName: string;
  content: string;
  deleted: boolean;
};

export type CommunityChatMessage = {
  id: string;
  churchId: string;
  organizationId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  authorName: string;
  authorInitials: string;
  replyTo: CommunityChatReplyPreview | null;
  replyCount: number;
  reactions: CommunityChatReactionSummary[];
};

export type CommunityChatPage = {
  messages: CommunityChatMessage[];
  hasMore: boolean;
};

export type CommunityChatThread = {
  root: CommunityChatMessage;
  replies: CommunityChatMessage[];
};

export type CommunityChatReactionResult = {
  messageId: string;
  reactions: CommunityChatReactionSummary[];
};

export type CommunityChatReportResult = {
  reported: boolean;
  duplicate: boolean;
};
