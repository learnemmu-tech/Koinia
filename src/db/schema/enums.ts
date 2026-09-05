import { pgEnum } from "drizzle-orm/pg-core";

export const platformRoleEnum = pgEnum("platform_role", ["user", "admin"]);

export const workspaceTypeEnum = pgEnum("workspace_type", [
  "independent_church",
  "multi_church_org",
]);

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "suspended",
  "trial",
]);

export const organizationMembershipRoleEnum = pgEnum(
  "organization_membership_role",
  ["owner", "org_admin"]
);

export const organizationMembershipStatusEnum = pgEnum(
  "organization_membership_status",
  ["active", "invited", "suspended"]
);

export const churchMembershipRoleEnum = pgEnum("church_membership_role", [
  "church_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
]);

export const churchMembershipStatusEnum = pgEnum("church_membership_status", [
  "pending",
  "active",
  "rejected",
  "suspended",
  "removed",
  "invited",
]);

export const enrollmentModeEnum = pgEnum("enrollment_mode", [
  "open",
  "approval_required",
  "invite_only",
  "closed",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const invitationDeliveryMethodEnum = pgEnum("invitation_delivery_method", [
  "email",
  "link",
]);

export const invitationRoleEnum = pgEnum("invitation_role", [
  "org_admin",
  "church_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
]);

export const planIdEnum = pgEnum("plan_id", [
  "free",
  "starter",
  "professional",
  "enterprise",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
]);

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "yearly",
]);

export const songCategoryEnum = pgEnum("song_category", [
  "Worship",
  "Praise",
  "Christmas",
  "Easter",
  "Youth",
  "Choir",
  "Special Event",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "Sunday Service",
  "Prayer Meeting",
  "Youth Fellowship",
  "Bible Study",
  "Conference",
  "Special Event",
  "Other",
]);

export const eventStatusEnum = pgEnum("event_status", ["draft", "published"]);

export const prayerRequestStatusEnum = pgEnum("prayer_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const prayerRequestCategoryEnum = pgEnum("prayer_request_category", [
  "general",
  "health",
  "family",
  "finances",
  "salvation",
  "guidance",
  "thanksgiving",
  "other",
]);

export const donationCampaignStatusEnum = pgEnum("donation_campaign_status", [
  "active",
  "inactive",
]);

export const donationCurrencyEnum = pgEnum("donation_currency", ["INR", "USD"]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "razorpay",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "song",
  "article",
  "sermon",
  "event",
  "prayer",
  "prayer_request_submitted",
  "membership_approved",
]);

export const favoriteItemTypeEnum = pgEnum("favorite_item_type", [
  "song",
  "sermon",
  "article",
  "event",
]);

export const recentlyViewedItemTypeEnum = pgEnum("recently_viewed_item_type", [
  "song",
  "sermon",
  "article",
]);
