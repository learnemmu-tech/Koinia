export const ENROLLMENT_MODES = [
  "open",
  "approval_required",
  "invite_only",
  "closed",
] as const;

export type EnrollmentMode = (typeof ENROLLMENT_MODES)[number];

export const DEFAULT_ENROLLMENT_MODE: EnrollmentMode = "approval_required";

export const ENROLLMENT_MODE_LABELS: Record<EnrollmentMode, string> = {
  open: "Open",
  approval_required: "Approval Required",
  invite_only: "Invite Only",
  closed: "Closed",
};

export const ENROLLMENT_MODE_DESCRIPTIONS: Record<EnrollmentMode, string> = {
  open: "Members become active immediately after joining.",
  approval_required: "Members must be approved by a church administrator.",
  invite_only: "Only email invitations can join. The public join link is disabled.",
  closed: "Nobody can join through the join link.",
};
