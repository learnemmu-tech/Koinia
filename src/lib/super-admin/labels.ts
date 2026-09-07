export function formatWorkspaceType(
  value: string | null | undefined
): string {
  if (value === "multi_church_org") return "Multi-church organization";
  if (value === "independent_church") return "Independent church";
  return value?.trim() || "Unknown";
}

export function formatOrganizationStatus(
  value: string | null | undefined
): string {
  if (value === "active") return "Active";
  if (value === "suspended") return "Suspended";
  if (value === "trial") return "Trial";
  return value?.trim() || "Unknown";
}

export function formatPlanId(value: string | null | undefined): string {
  if (!value) return "None";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatSubscriptionStatus(
  value: string | null | undefined
): string {
  if (!value) return "None";
  if (value === "past_due") return "Past due";
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export function formatMembershipStatus(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMembershipRole(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPublishStatus(published: boolean): string {
  return published ? "Published" : "Draft";
}

export function formatEnrollmentMode(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPlatformRole(value: string | null | undefined): string {
  if (!value) return "User";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPeriodRange(
  start: Date | null,
  end: Date | null
): string {
  if (!start && !end) return "—";
  if (start && end) {
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }
  if (start) return `From ${formatShortDate(start)}`;
  return `Until ${formatShortDate(end!)}`;
}

export function formatShortDate(value: Date | string): string {
  const date =
    value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
