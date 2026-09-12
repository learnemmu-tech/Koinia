"use client";

import { useTranslations } from "next-intl";

import type { Messages } from "./messages";

type NavigationKey = keyof Messages["navigation"];

const NAV_LABEL_KEYS: Record<string, NavigationKey> = {
  Home: "home",
  Dashboard: "dashboard",
  Members: "members",
  Analytics: "analytics",
  "Content Management": "contentManagement",
  Songs: "songs",
  Sermons: "sermons",
  Articles: "articles",
  Shorts: "shorts",
  Events: "events",
  Donations: "donations",
  "Prayer Requests": "prayerRequests",
  Books: "books",
  Library: "library",
  "Super Admin": "superAdmin",
  "Church Settings": "churchSettings",
  Billing: "billing",
  "Organization Settings": "organizationSettings",
  Churches: "churches",
  "Add Church": "addChurch",
  About: "about",
  Pricing: "pricing",
  Ministry: "ministry",
  "Privacy Policy": "privacyPolicy",
  "Terms of Service": "termsOfService",
  Manage: "sectionManage",
  Browse: "sectionBrowse",
  Resources: "sectionResources",
  Settings: "sectionSettings",
  Content: "sectionContent",
  Community: "sectionCommunity",
  Organization: "sectionOrganization",
  Tools: "sectionTools",
  "Shepherd AI": "shepherdAi",
};

export function useNavLabel() {
  const t = useTranslations("navigation");

  return (label: string) => {
    const key = NAV_LABEL_KEYS[label];
    return key ? t(key) : label;
  };
}
