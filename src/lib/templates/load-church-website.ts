import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { listPublishedChurchVideos } from "@/lib/postgres/church-videos";
import {
  getChurchWebsiteConfig,
} from "@/lib/postgres/church-websites";
import {
  listArticles,
  listDonationCampaigns,
  listEvents,
  listSermons,
} from "@/lib/postgres/features";
import { listPublicChurchMinistries } from "@/lib/postgres/public-ministries";
import { userIsActiveChurchMember } from "@/lib/postgres/session";
import { getChurchBySlug } from "@/lib/postgres/tenants";
import { withConnectionRetry } from "@/lib/postgres/with-connection-retry";
import { resolvePublicTemplateId } from "@/lib/templates/resolver";
import type {
  ChurchWebsiteIdentity,
  ChurchWebsiteViewModel,
  TemplateId,
} from "@/lib/templates/types";
import type { FirebaseChurch } from "@/types/firebase-church";

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function toChurchWebsiteIdentity(
  church: FirebaseChurch
): ChurchWebsiteIdentity {
  return {
    id: church.id,
    organizationId: church.organizationId ?? "",
    name: church.name,
    slug: church.slug,
    description: optionalText(church.description),
    welcomeMessage: optionalText(church.welcomeMessage),
    pastorName: optionalText(church.pastorName),
    establishedYear: church.establishedYear,
    denomination: optionalText(church.denomination),
    address: optionalText(church.address),
    city: optionalText(church.city),
    state: optionalText(church.state),
    country: optionalText(church.country),
    phone: optionalText(church.phone),
    email: optionalText(church.email),
    logoUrl: optionalText(church.logoUrl),
    bannerUrl: optionalText(church.bannerUrl ?? church.coverImage),
    showPrayerWall: church.settings?.showPrayerWall !== false,
  };
}

async function resolveViewer(churchId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { isAuthenticated: false, isMember: false };
  }
  const isMember = await userIsActiveChurchMember(userId, churchId);
  return { isAuthenticated: true, isMember };
}

export const loadChurchWebsiteBySlug = cache(async (
  slug: string,
  options?: { templateOverride?: TemplateId }
): Promise<ChurchWebsiteViewModel | null> => {
  const church = await getChurchBySlug(slug);
  if (!church || !church.isActive || !church.organizationId) return null;
  const model = await withConnectionRetry(() =>
    loadChurchWebsite(church, options)
  );
  if (!model) return null;
  const publicSlug = slug.trim().toLowerCase();
  return {
    ...model,
    church: { ...model.church, slug: publicSlug || model.church.slug },
  };
});

export async function loadChurchWebsite(
  church: FirebaseChurch,
  options?: { templateOverride?: TemplateId }
): Promise<ChurchWebsiteViewModel | null> {
  const organizationId = church.organizationId?.trim();
  if (!organizationId || !church.isActive) return null;

  const website = await getChurchWebsiteConfig(church);
  const templateId = resolvePublicTemplateId(
    options?.templateOverride ?? website.activeTemplate
  );
  const scope = tenantContentQuery({
    organizationId,
    churchId: church.id,
  });

  const [sermons, events, articles, videos, campaigns, ministries, viewer] =
    await Promise.all([
      listSermons(scope, { publishedOnly: true, limit: 12 }),
      listEvents(scope, { publishedOnly: true, limit: 12 }),
      listArticles(scope, { publishedOnly: true, limit: 12 }),
      listPublishedChurchVideos({ query: scope, limit: 12 }),
      listDonationCampaigns(scope, { publishedOnly: true, limit: 8 }),
      listPublicChurchMinistries({
        churchId: church.id,
        organizationId,
        limit: 8,
      }),
      resolveViewer(church.id),
    ]);

  return {
    church: toChurchWebsiteIdentity(church),
    website: {
      ...website,
      activeTemplate: templateId,
    },
    templateId,
    sermons,
    events,
    articles,
    videos,
    campaigns,
    ministries,
    viewer,
    isDemo: false,
  };
}
