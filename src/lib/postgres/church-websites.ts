import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { churchWebsites } from "@/db/schema";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { parseSocialLinks } from "@/lib/templates/social-links";
import {
  parseAboutBeliefs,
  parseAboutValues,
  type AboutCopyItem,
} from "@/lib/templates/about-content";
import {
  DEFAULT_TEMPLATE_ID,
  isTemplateId,
  parseTemplateId,
} from "@/lib/templates/registry";
import type {
  ChurchWebsiteConfig,
  TemplateId,
  TemplateImageSlot,
  WebsiteSocialLinks,
  WebsiteVisibility,
} from "@/lib/templates/types";
import { parseWebsiteVisibility } from "@/lib/templates/visibility";
import type { FirebaseChurch } from "@/types/firebase-church";

type WebsiteRow = typeof churchWebsites.$inferSelect;

export type ChurchWebsiteUpdateInput = {
  activeTemplate?: TemplateId;
  completeWebsiteSetup?: boolean;
  siteTitle?: string | null;
  metaDescription?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  indexable?: boolean;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  aboutImageUrl?: string | null;
  featuredMinistryImageUrl?: string | null;
  worshipImageUrl?: string | null;
  socialPreviewImageUrl?: string | null;
  heroEyebrow?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  scriptureReference?: string | null;
  scriptureText?: string | null;
  serviceLabel?: string | null;
  serviceTime?: string | null;
  serviceLocation?: string | null;
  aboutHeadline?: string | null;
  aboutIntro?: string | null;
  aboutMission?: string | null;
  aboutVision?: string | null;
  aboutCommunity?: string | null;
  aboutValues?: AboutCopyItem[];
  aboutBeliefs?: AboutCopyItem[];
  socialLinks?: WebsiteSocialLinks;
  visibility?: Partial<WebsiteVisibility>;
};

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapImages(row: WebsiteRow | null, church: FirebaseChurch) {
  const images: Partial<Record<TemplateImageSlot, string>> = {};
  const logo = optionalText(row?.logoUrl) ?? optionalText(church.logoUrl);
  const hero = optionalText(row?.heroImageUrl);
  const about = optionalText(row?.aboutImageUrl);
  const featuredMinistry = optionalText(row?.featuredMinistryImageUrl);
  const worship = optionalText(row?.worshipImageUrl);
  const socialPreview =
    optionalText(row?.socialPreviewImageUrl) ?? optionalText(row?.ogImageUrl);
  const favicon = optionalText(row?.faviconUrl) ?? logo;

  if (logo) images.logo = logo;
  if (hero) images.hero = hero;
  if (about) images.about = about;
  if (featuredMinistry) images.featuredMinistry = featuredMinistry;
  if (worship) images.worship = worship;
  if (socialPreview) images.socialPreview = socialPreview;
  if (favicon) images.favicon = favicon;

  return images;
}

export function defaultWebsiteConfig(
  church: FirebaseChurch
): ChurchWebsiteConfig {
  return {
    churchId: church.id,
    organizationId: church.organizationId ?? "",
    activeTemplate: DEFAULT_TEMPLATE_ID,
    siteTitle: church.name,
    metaDescription:
      optionalText(church.description) ??
      optionalText(church.welcomeMessage) ??
      `${church.name} is a church community. Join us for worship, teaching, and fellowship.`,
    logoUrl: optionalText(church.logoUrl),
    images: mapImages(null, church),
    indexable: true,
    socialLinks: {},
    visibility: parseWebsiteVisibility(
      {},
      {
        events: church.settings?.showEvents !== false,
        giving: church.settings?.showDonations !== false,
      }
    ),
    aboutValues: [],
    aboutBeliefs: [],
  };
}

export function mapWebsiteConfig(
  row: WebsiteRow | null,
  church: FirebaseChurch
): ChurchWebsiteConfig {
  if (!row) return defaultWebsiteConfig(church);

  const defaults = defaultWebsiteConfig(church);
  return {
    churchId: church.id,
    organizationId: church.organizationId ?? row.organizationId,
    activeTemplate: parseTemplateId(row.activeTemplate),
    siteTitle: optionalText(row.siteTitle) ?? defaults.siteTitle,
    metaDescription:
      optionalText(row.metaDescription) ?? defaults.metaDescription,
    faviconUrl: optionalText(row.faviconUrl),
    ogImageUrl: optionalText(row.ogImageUrl),
    canonicalUrl: optionalText(row.canonicalUrl),
    indexable: row.indexable,
    logoUrl: optionalText(row.logoUrl) ?? defaults.logoUrl,
    images: mapImages(row, church),
    heroEyebrow: optionalText(row.heroEyebrow),
    heroHeadline: optionalText(row.heroHeadline),
    heroSubheadline: optionalText(row.heroSubheadline),
    scriptureReference: optionalText(row.scriptureReference),
    scriptureText: optionalText(row.scriptureText),
    serviceLabel: optionalText(row.serviceLabel),
    serviceTime: optionalText(row.serviceTime),
    serviceLocation: optionalText(row.serviceLocation),
    aboutHeadline: optionalText(row.aboutHeadline),
    aboutIntro: optionalText(row.aboutIntro),
    aboutMission: optionalText(row.aboutMission),
    aboutVision: optionalText(row.aboutVision),
    aboutCommunity: optionalText(row.aboutCommunity),
    aboutValues: parseAboutValues(row.aboutValues),
    aboutBeliefs: parseAboutBeliefs(row.aboutBeliefs),
    socialLinks: parseSocialLinks(row.socialLinks),
    visibility: parseWebsiteVisibility(row.visibility, defaults.visibility),
  };
}

export async function isWebsiteSetupCompleted(
  churchId: string | null | undefined,
  organizationId: string | null | undefined
): Promise<boolean> {
  if (!churchId?.trim() || !organizationId?.trim()) return true;
  const row = await getChurchWebsiteRow(churchId, organizationId);
  if (!row) return true;
  return row.websiteSetupCompletedAt != null;
}

export async function getChurchWebsiteRow(
  churchId: string,
  organizationId: string
) {
  if (!isPostgresUuid(churchId) || !isPostgresUuid(organizationId)) {
    return null;
  }

  const [row] = await db
    .select()
    .from(churchWebsites)
    .where(
      and(
        eq(churchWebsites.churchId, churchId),
        eq(churchWebsites.organizationId, organizationId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getChurchWebsiteConfig(
  church: FirebaseChurch
): Promise<ChurchWebsiteConfig> {
  noStore();
  const organizationId = church.organizationId?.trim();
  if (!organizationId) return defaultWebsiteConfig(church);
  const row = await getChurchWebsiteRow(church.id, organizationId);
  return mapWebsiteConfig(row, church);
}

/** Stored `church_websites.active_template` only — no Signature fallback. */
export async function getActiveTemplateForChurch(
  churchId: string,
  organizationId: string
): Promise<TemplateId | null> {
  const row = await getChurchWebsiteRow(churchId, organizationId);
  return isTemplateId(row?.activeTemplate) ? row.activeTemplate : null;
}

function nullableText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function upsertChurchWebsite(
  church: FirebaseChurch,
  input: ChurchWebsiteUpdateInput
): Promise<ChurchWebsiteConfig> {
  const organizationId = church.organizationId?.trim();
  if (!organizationId) {
    throw new Error("Church is missing an organization.");
  }

  const existing = await getChurchWebsiteRow(church.id, organizationId);
  const current = mapWebsiteConfig(existing, church);
  const nextVisibility = input.visibility
    ? { ...current.visibility, ...input.visibility }
    : current.visibility;
  const nextSocial = input.socialLinks
    ? parseSocialLinks(input.socialLinks)
    : current.socialLinks;

  const values = {
    churchId: church.id,
    organizationId,
    activeTemplate: input.activeTemplate ?? current.activeTemplate,
    siteTitle:
      input.siteTitle !== undefined
        ? nullableText(input.siteTitle)
        : current.siteTitle,
    metaDescription:
      input.metaDescription !== undefined
        ? nullableText(input.metaDescription)
        : current.metaDescription,
    faviconUrl:
      input.faviconUrl !== undefined
        ? nullableText(input.faviconUrl)
        : current.faviconUrl ?? null,
    ogImageUrl:
      input.ogImageUrl !== undefined
        ? nullableText(input.ogImageUrl)
        : current.ogImageUrl ?? null,
    canonicalUrl:
      input.canonicalUrl !== undefined
        ? nullableText(input.canonicalUrl)
        : current.canonicalUrl ?? null,
    indexable: input.indexable ?? current.indexable,
    logoUrl:
      input.logoUrl !== undefined
        ? nullableText(input.logoUrl)
        : current.logoUrl ?? null,
    heroImageUrl:
      input.heroImageUrl !== undefined
        ? nullableText(input.heroImageUrl)
        : current.images.hero ?? null,
    aboutImageUrl:
      input.aboutImageUrl !== undefined
        ? nullableText(input.aboutImageUrl)
        : current.images.about ?? null,
    featuredMinistryImageUrl:
      input.featuredMinistryImageUrl !== undefined
        ? nullableText(input.featuredMinistryImageUrl)
        : current.images.featuredMinistry ?? null,
    worshipImageUrl:
      input.worshipImageUrl !== undefined
        ? nullableText(input.worshipImageUrl)
        : current.images.worship ?? null,
    socialPreviewImageUrl:
      input.socialPreviewImageUrl !== undefined
        ? nullableText(input.socialPreviewImageUrl)
        : current.images.socialPreview ?? null,
    heroEyebrow:
      input.heroEyebrow !== undefined
        ? nullableText(input.heroEyebrow)
        : current.heroEyebrow ?? null,
    heroHeadline:
      input.heroHeadline !== undefined
        ? nullableText(input.heroHeadline)
        : current.heroHeadline ?? null,
    heroSubheadline:
      input.heroSubheadline !== undefined
        ? nullableText(input.heroSubheadline)
        : current.heroSubheadline ?? null,
    scriptureReference:
      input.scriptureReference !== undefined
        ? nullableText(input.scriptureReference)
        : current.scriptureReference ?? null,
    scriptureText:
      input.scriptureText !== undefined
        ? nullableText(input.scriptureText)
        : current.scriptureText ?? null,
    serviceLabel:
      input.serviceLabel !== undefined
        ? nullableText(input.serviceLabel)
        : current.serviceLabel ?? null,
    serviceTime:
      input.serviceTime !== undefined
        ? nullableText(input.serviceTime)
        : current.serviceTime ?? null,
    serviceLocation:
      input.serviceLocation !== undefined
        ? nullableText(input.serviceLocation)
        : current.serviceLocation ?? null,
    aboutHeadline:
      input.aboutHeadline !== undefined
        ? nullableText(input.aboutHeadline)
        : current.aboutHeadline ?? null,
    aboutIntro:
      input.aboutIntro !== undefined
        ? nullableText(input.aboutIntro)
        : current.aboutIntro ?? null,
    aboutMission:
      input.aboutMission !== undefined
        ? nullableText(input.aboutMission)
        : current.aboutMission ?? null,
    aboutVision:
      input.aboutVision !== undefined
        ? nullableText(input.aboutVision)
        : current.aboutVision ?? null,
    aboutCommunity:
      input.aboutCommunity !== undefined
        ? nullableText(input.aboutCommunity)
        : current.aboutCommunity ?? null,
    aboutValues:
      input.aboutValues !== undefined
        ? parseAboutValues(input.aboutValues)
        : current.aboutValues,
    aboutBeliefs:
      input.aboutBeliefs !== undefined
        ? parseAboutBeliefs(input.aboutBeliefs)
        : current.aboutBeliefs,
    socialLinks: nextSocial,
    visibility: nextVisibility,
    websiteSetupCompletedAt: input.completeWebsiteSetup
      ? existing?.websiteSetupCompletedAt ?? new Date()
      : existing?.websiteSetupCompletedAt ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(churchWebsites)
      .set(values)
      .where(eq(churchWebsites.id, existing.id));
  } else {
    await db.insert(churchWebsites).values(values);
  }

  return getChurchWebsiteConfig(church);
}
