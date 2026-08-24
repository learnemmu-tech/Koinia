import type { BranchSettings } from "@/types/branch";
import {
  DEFAULT_ENROLLMENT_MODE,
  type EnrollmentMode,
  ENROLLMENT_MODES,
} from "@/types/enrollment";

export function normalizeEnrollmentMode(value: unknown): EnrollmentMode {
  const raw = String(value ?? "").trim().toLowerCase();
  if (ENROLLMENT_MODES.includes(raw as EnrollmentMode)) {
    return raw as EnrollmentMode;
  }
  return DEFAULT_ENROLLMENT_MODE;
}

export function resolveBranchEnrollmentSettings(
  settings?: BranchSettings | null
): Required<Pick<BranchSettings, "enrollmentMode" | "joinUrlEnabled">> {
  return {
    enrollmentMode: normalizeEnrollmentMode(settings?.enrollmentMode),
    joinUrlEnabled: settings?.joinUrlEnabled !== false,
  };
}

export function isPublicJoinAllowed(settings?: BranchSettings | null): boolean {
  const { enrollmentMode, joinUrlEnabled } =
    resolveBranchEnrollmentSettings(settings);
  if (!joinUrlEnabled) return false;
  if (enrollmentMode === "closed" || enrollmentMode === "invite_only") {
    return false;
  }
  return true;
}

export function getJoinFlowMessage(enrollmentMode: EnrollmentMode): string {
  if (enrollmentMode === "open") {
    return "You will join immediately after signing in.";
  }
  return "Your request will be reviewed by a church administrator.";
}

export function getJoinBlockedReason(
  settings?: BranchSettings | null
): string | null {
  const { enrollmentMode, joinUrlEnabled } =
    resolveBranchEnrollmentSettings(settings);

  if (!joinUrlEnabled) {
    return "This church has disabled their public join link.";
  }
  if (enrollmentMode === "closed") {
    return "This church is not accepting new members at this time.";
  }
  if (enrollmentMode === "invite_only") {
    return "This church only accepts members through email invitations.";
  }
  return null;
}
