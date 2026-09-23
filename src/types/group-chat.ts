export {
  COMMUNITY_MESSAGE_MAX_LENGTH,
  COMMUNITY_MESSAGE_PAGE_SIZE,
  COMMUNITY_REACTION_TYPES,
  COMMUNITY_REACTION_EMOJI,
  COMMUNITY_REPORT_REASONS,
  type CommunityReactionType,
  type CommunityReportReason,
} from "@/types/community-chat";

export {
  COMMUNITY_MESSAGE_MAX_LENGTH as GROUP_MESSAGE_MAX_LENGTH,
  COMMUNITY_MESSAGE_PAGE_SIZE as GROUP_MESSAGE_PAGE_SIZE,
  COMMUNITY_REACTION_TYPES as GROUP_REACTION_TYPES,
  COMMUNITY_REACTION_EMOJI as GROUP_REACTION_EMOJI,
  COMMUNITY_REPORT_REASONS as GROUP_REPORT_REASONS,
  type CommunityReactionType as GroupReactionType,
  type CommunityReportReason as GroupReportReason,
  type CommunityChatReactionSummary as GroupChatReactionSummary,
  type CommunityChatReplyPreview as GroupChatReplyPreview,
  type CommunityChatReactionResult as GroupChatReactionResult,
  type CommunityChatReportResult as GroupChatReportResult,
} from "@/types/community-chat";

import type { CommunityChatMessage } from "@/types/community-chat";

export type GroupChatMessage = CommunityChatMessage & {
  groupId: string;
};

export type GroupChatPage = {
  messages: GroupChatMessage[];
  hasMore: boolean;
};

export type GroupChatThread = {
  root: GroupChatMessage;
  replies: GroupChatMessage[];
};
