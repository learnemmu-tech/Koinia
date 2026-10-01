import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  getChurchWebsiteConfig,
  upsertChurchWebsite,
  type ChurchWebsiteUpdateInput,
} from "@/lib/postgres/church-websites";
import { userCanManageChurch } from "@/lib/postgres/session";
import { getChurchById } from "@/lib/postgres/tenants";
import { canSelectTemplate, parseTemplateId } from "@/lib/templates/resolver";
import { getTemplateManifest, listTemplateManifests } from "@/lib/templates/registry";
import { parseSocialLinks } from "@/lib/templates/social-links";
import { parseAboutBeliefs, parseAboutValues } from "@/lib/templates/about-content";
import { churchWebsitePath } from "@/lib/templates/paths";
import { revalidateChurchPublicSite } from "@/lib/templates/revalidate-church-website";
import { parseWebsiteVisibility } from "@/lib/templates/visibility";
import { WEBSITE_VISIBILITY_KEYS } from "@/lib/templates/types";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { assertChurchContentWritable, isSubscriptionLimitError } from "@/lib/subscription/subscription-server";

type RouteContext = { params: Promise<{ churchId: string }> };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value;
}

function parseHttpsOrPath(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const decoded = await verifyBearerToken(_request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { churchId } = await context.params;
  if (!isPostgresUuid(churchId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await userCanManageChurch(decoded.uid, decoded.email, churchId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const church = await getChurchById(churchId);
  if (!church) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const website = await getChurchWebsiteConfig(church);
  return NextResponse.json({
    website,
    publicPath: churchWebsitePath(church.slug),
    templates: listTemplateManifests(),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { churchId } = await context.params;
  if (!isPostgresUuid(churchId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await userCanManageChurch(decoded.uid, decoded.email, churchId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const church = await getChurchById(churchId);
  if (!church) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await assertChurchContentWritable(churchId);
  } catch (error) {
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const input: ChurchWebsiteUpdateInput = {};

  if (body.activeTemplate !== undefined) {
    if (typeof body.activeTemplate !== "string") {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }
    const templateId = parseTemplateId(body.activeTemplate);
    if (templateId !== body.activeTemplate) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }
    if (!canSelectTemplate(getTemplateManifest(templateId))) {
      return NextResponse.json(
        { error: "That template is not available yet." },
        { status: 400 }
      );
    }
    input.activeTemplate = templateId;
  }

  const textFields = [
    "siteTitle",
    "metaDescription",
    "heroEyebrow",
    "heroHeadline",
    "heroSubheadline",
    "scriptureReference",
    "scriptureText",
    "serviceLabel",
    "serviceTime",
    "serviceLocation",
    "aboutHeadline",
    "aboutIntro",
    "aboutMission",
    "aboutVision",
    "aboutCommunity",
  ] as const;

  for (const field of textFields) {
    const value = optionalString(body[field]);
    if (value !== undefined) input[field] = value;
  }

  const urlFields = [
    "faviconUrl",
    "ogImageUrl",
    "canonicalUrl",
    "logoUrl",
    "heroImageUrl",
    "aboutImageUrl",
    "featuredMinistryImageUrl",
    "worshipImageUrl",
    "socialPreviewImageUrl",
  ] as const;

  for (const field of urlFields) {
    const parsed = parseHttpsOrPath(optionalString(body[field]));
    if (parsed === undefined && body[field] !== undefined) {
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    }
    if (parsed !== undefined) input[field] = parsed;
  }

  if (body.indexable !== undefined) {
    if (typeof body.indexable !== "boolean") {
      return NextResponse.json({ error: "Invalid indexable value" }, { status: 400 });
    }
    input.indexable = body.indexable;
  }

  if (body.socialLinks !== undefined) {
    input.socialLinks = parseSocialLinks(body.socialLinks);
  }

  if (body.visibility !== undefined) {
    if (typeof body.visibility !== "object" || body.visibility === null) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }
    const visibility = parseWebsiteVisibility(body.visibility);
    const partial: ChurchWebsiteUpdateInput["visibility"] = {};
    for (const key of WEBSITE_VISIBILITY_KEYS) {
      partial[key] = visibility[key];
    }
    input.visibility = partial;
  }

  if (body.aboutValues !== undefined) {
    if (!Array.isArray(body.aboutValues)) {
      return NextResponse.json({ error: "Invalid about values" }, { status: 400 });
    }
    input.aboutValues = parseAboutValues(body.aboutValues);
  }

  if (body.aboutBeliefs !== undefined) {
    if (!Array.isArray(body.aboutBeliefs)) {
      return NextResponse.json({ error: "Invalid about beliefs" }, { status: 400 });
    }
    input.aboutBeliefs = parseAboutBeliefs(body.aboutBeliefs);
  }

  if (body.completeWebsiteSetup === true) {
    input.completeWebsiteSetup = true;
  }

  const website = await upsertChurchWebsite(church, input);
  const publicPath = churchWebsitePath(church.slug);
  await revalidateChurchPublicSite(church.id);
  revalidatePath(`/preview/website/${website.activeTemplate}`);
  return NextResponse.json({
    website,
    publicPath,
  });
}
