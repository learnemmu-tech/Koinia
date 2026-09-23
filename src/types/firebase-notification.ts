export type NotificationContentType =
  | "song"
  | "article"
  | "sermon"
  | "event"
  | "prayer"
  | "prayer_request_submitted"
  | "membership_approved"
  | "membership_request"
  | "book"
  | "trial_lifecycle"
  | "short_pending_review"
  | "short_review_result"
  | "group_invitation";

export type FirebaseNotification = {
  id: string;
  type: NotificationContentType;
  /** Recipient user ID — each user reads only their own notifications. */
  userId: string;
  /** Church the notification belongs to. */
  churchId: string;
  /** Heading, e.g. "New Song Added". */
  title: string;
  /** Body message, e.g. "A new worship song has been added." */
  message: string;
  /** Title of the related content item, e.g. "Jesus Christ". */
  contentTitle: string;
  /** Optional thumbnail image URL for the related content. */
  image?: string;
  /** ID of the related song/article/sermon, or branch for membership alerts. */
  contentId: string;
  /** Whether the user has read this notification (legacy docs may omit). */
  read?: boolean;
  createdAt: number;
};
