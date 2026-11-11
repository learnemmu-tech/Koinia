import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { listPublishedChurchVideos } from "@/lib/postgres/church-videos";
import {
  readChurchWebsiteConfig,
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
import { logNavStage } from "@/lib/nav-trace";
import { readNavTraceId } from "@/lib/nav-trace-server";
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

const ANONYMOUS_VIEWER = { isAuthenticated: false, isMember: false };

async function resolveViewer(churchId: string) {
  const headerStore = await headers();
  if (headerStore.get("x-koinia-session") === "0") {
    return ANONYMOUS_VIEWER;
  }
  const { userId } = await auth();
  if (!userId) {
    return ANONYMOUS_VIEWER;
  }
  const isMember = await userIsActiveChurchMember(userId, churchId);
  return { isAuthenticated: true, isMember };
}

async function loadPublicChurchCore(slug: string) {
  const church = await getChurchBySlug(slug);
  if (!church || !church.isActive || !church.organizationId) return null;
  const website = await readChurchWebsiteConfig(church);
  const templateId = resolvePublicTemplateId(website.activeTemplate);
  return { church, website, templateId };
}

export function cachedPublicChurchCore(slug: string) {
  return unstable_cache(
    () => loadPublicChurchCore(slug),
    ["church-public-core", slug],
    { revalidate: 60, tags: [`church-public-${slug}`] }
  )();
}

type LoadChurchWebsiteOptions = {
  templateOverride?: TemplateId;
  /**
   * Layouts and Signature routes only need identity, template, and viewer.
   * Content lists are loaded for Heritage pages that render them.
   */
  includeContent?: boolean;
};

const loadChurchCore = cache(async (slug: string) => {
  const core = await cachedPublicChurchCore(slug.trim().toLowerCase());
  if (!core) return null;
  const viewer = await resolveViewer(core.church.id);
  return { ...core, viewer };
});

function shellModel(
  core: NonNullable<Awaited<ReturnType<typeof loadChurchCore>>>,
  publicSlug: string,
  templateId: TemplateId
): ChurchWebsiteViewModel {
  return {
    church: {
      ...toChurchWebsiteIdentity(core.church),
      slug: publicSlug || core.church.slug,
    },
    website: { ...core.website, activeTemplate: templateId },
    templateId,
    sermons: [],
    events: [],
    articles: [],
    videos: [],
    campaigns: [],
    ministries: [],
    viewer: core.viewer,
    isDemo: false,
  };
}

export const loadChurchWebsiteBySlug = cache(async (
  slug: string,
  options?: LoadChurchWebsiteOptions
): Promise<ChurchWebsiteViewModel | null> => {
  const traceId = await readNavTraceId();
  const startedAt = Date.now();
  let includeContent = true;
  try {
    const core = await loadChurchCore(slug);
    if (!core) return null;
    const templateId = resolvePublicTemplateId(
      options?.templateOverride ?? core.templateId
    );
    const publicSlug = slug.trim().toLowerCase();
    includeContent = options?.includeContent !== false;
    if (!includeContent) {
      return shellModel(core, publicSlug, templateId);
    }
    const model = await withConnectionRetry(() =>
      loadChurchWebsite(core.church, {
        ...options,
        templateId,
        viewer: core.viewer,
        website: core.website,
      })
    );
    if (!model) return null;
    return {
      ...model,
      church: { ...model.church, slug: publicSlug || model.church.slug },
    };
  } finally {
    logNavStage(traceId, "church.website", startedAt, { includeContent });
  }
});

export async function loadChurchWebsite(
  church: FirebaseChurch,
  options?: {
    templateOverride?: TemplateId;
    templateId?: TemplateId;
    viewer?: ChurchWebsiteViewModel["viewer"];
    website?: ChurchWebsiteViewModel["website"];
  }
): Promise<ChurchWebsiteViewModel | null> {
  const organizationId = church.organizationId?.trim();
  if (!organizationId || !church.isActive) return null;

  const website = options?.website ?? (await readChurchWebsiteConfig(church));
  const templateId =
    options?.templateId ??
    resolvePublicTemplateId(
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
      options?.viewer
        ? Promise.resolve(options.viewer)
        : resolveViewer(church.id),
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
