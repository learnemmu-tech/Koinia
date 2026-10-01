import type { AboutCopyItem } from "@/lib/templates/about-content";
import type { ChurchVideo } from "@/types/church-video";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";

export const TEMPLATE_IDS = ["signature", "heritage", "sanctuary"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_IMAGE_SLOTS = [
  "hero",
  "about",
  "featuredMinistry",
  "worship",
  "socialPreview",
  "logo",
  "favicon",
] as const;

export type TemplateImageSlot = (typeof TEMPLATE_IMAGE_SLOTS)[number];

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "x",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const WEBSITE_VISIBILITY_KEYS = [
  "about",
  "sermons",
  "events",
  "ministries",
  "articles",
  "videos",
  "giving",
  "contact",
] as const;

export type WebsiteVisibilityKey = (typeof WEBSITE_VISIBILITY_KEYS)[number];

export type WebsiteSocialLinks = Partial<Record<SocialPlatform, string>>;

export type WebsiteVisibility = Record<WebsiteVisibilityKey, boolean>;

export type ChurchWebsiteConfig = {
  churchId: string;
  organizationId: string;
  activeTemplate: TemplateId;
  siteTitle: string;
  metaDescription: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  indexable: boolean;
  logoUrl?: string;
  images: Partial<Record<TemplateImageSlot, string>>;
  heroEyebrow?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  scriptureReference?: string;
  scriptureText?: string;
  serviceLabel?: string;
  serviceTime?: string;
  serviceLocation?: string;
  aboutHeadline?: string;
  aboutIntro?: string;
  aboutMission?: string;
  aboutVision?: string;
  aboutCommunity?: string;
  aboutValues: AboutCopyItem[];
  aboutBeliefs: AboutCopyItem[];
  socialLinks: WebsiteSocialLinks;
  visibility: WebsiteVisibility;
};

export type PublicMinistrySummary = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
};

export type ChurchWebsiteIdentity = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  welcomeMessage?: string;
  pastorName?: string;
  establishedYear?: number;
  denomination?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  showPrayerWall?: boolean;
};

export type ChurchWebsiteViewer = {
  isAuthenticated: boolean;
  isMember: boolean;
};

export type ChurchWebsiteViewModel = {
  church: ChurchWebsiteIdentity;
  website: ChurchWebsiteConfig;
  templateId: TemplateId;
  sermons: FirebaseSermon[];
  events: FirebaseEvent[];
  articles: FirebaseArticle[];
  videos: ChurchVideo[];
  campaigns: FirebaseDonationCampaign[];
  ministries: PublicMinistrySummary[];
  viewer: ChurchWebsiteViewer;
  isDemo: boolean;
};

export type TemplateNavItem = {
  href: string;
  label: string;
};

export type TemplatePageName =
  | "home"
  | "about"
  | "sermons"
  | "sermonDetail"
  | "events"
  | "eventDetail"
  | "ministries"
  | "articles"
  | "articleDetail"
  | "videos"
  | "give"
  | "giveDetail"
  | "contact"
  | "prayer"
  | "memberGate";

export type TemplateManifest = {
  id: TemplateId;
  name: string;
  description: string;
  previewImage: string;
  implemented: boolean;
  supportedSections: TemplatePageName[];
  imageSlots: TemplateImageSlot[];
};

export type TemplatePageProps = {
  model: ChurchWebsiteViewModel;
};

export type TemplateDetailPageProps<T> = TemplatePageProps & {
  item: T;
};

export type TemplatePages = {
  Shell: (props: TemplatePageProps & { children: React.ReactNode }) => React.ReactNode;
  Home: (props: TemplatePageProps) => React.ReactNode;
  About: (props: TemplatePageProps) => React.ReactNode;
  Sermons: (props: TemplatePageProps) => React.ReactNode;
  SermonDetail: (props: TemplateDetailPageProps<FirebaseSermon>) => React.ReactNode;
  Events: (props: TemplatePageProps) => React.ReactNode;
  EventDetail: (props: TemplateDetailPageProps<FirebaseEvent>) => React.ReactNode;
  Ministries: (props: TemplatePageProps) => React.ReactNode;
  Articles: (props: TemplatePageProps) => React.ReactNode;
  ArticleDetail: (props: TemplateDetailPageProps<FirebaseArticle>) => React.ReactNode;
  Videos: (props: TemplatePageProps) => React.ReactNode;
  Give: (props: TemplatePageProps) => React.ReactNode;
  GiveDetail: (
    props: TemplateDetailPageProps<FirebaseDonationCampaign>
  ) => React.ReactNode;
  Contact: (props: TemplatePageProps) => React.ReactNode;
  Prayer: (props: TemplatePageProps) => React.ReactNode;
  MemberGate: (
    props: TemplatePageProps & { featureLabel: string }
  ) => React.ReactNode;
};

export type WebsiteTemplate = {
  manifest: TemplateManifest;
  pages: TemplatePages | null;
};
