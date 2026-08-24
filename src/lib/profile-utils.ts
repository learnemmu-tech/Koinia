import { toMillis } from "@/lib/firebase-utils";

const JOIN_DATE_LOCALE = "en-US";

export function formatJoinDate(createdAt: unknown): string {
  const timestamp = toMillis(createdAt);
  if (!timestamp) return "—";

  return new Intl.DateTimeFormat(JOIN_DATE_LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function getDisplayName(
  profile: { firstName?: string; lastName?: string } | null,
  authUser: { displayName?: string | null } | null
): string {
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  }

  return authUser?.displayName?.trim() || "User";
}
