import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { contentCacheKey, tenantContentQuery } from "@/lib/content/content-scope";
import { getChurchById } from "@/lib/postgres/tenants";
import { churchWebsitePath } from "@/lib/templates/paths";

const PUBLIC_SUBPATHS = [
  "/about",
  "/sermons",
  "/songs",
  "/articles",
  "/videos",
  "/books",
  "/events",
  "/give",
  "/prayer",
  "/community",
  "/contact",
  "/ministries",
  "/shepherd",
] as const;

/** Refresh one church's public website after that church's content or branding changes. */
export async function revalidateChurchPublicSite(
  churchId: string | null | undefined
) {
  const id = churchId?.trim();
  if (!id) return;

  const church = await getChurchById(id);
  if (!church?.slug) return;

  const publicPath = churchWebsitePath(church.slug);
  revalidatePath(publicPath, "layout");
  revalidatePath(publicPath, "page");
  for (const subpath of PUBLIC_SUBPATHS) {
    revalidatePath(churchWebsitePath(church.slug, subpath));
  }

  if (church.organizationId) {
    const key = contentCacheKey(
      tenantContentQuery({
        organizationId: church.organizationId,
        churchId: church.id,
      })
    );
    revalidateTag(`content-${key}`);
    revalidateTag(`tenant-${key}`);
  }

  revalidateTag("donations");
  revalidateTag("worship-songs");
  revalidateTag("worship-sermons");
  revalidateTag("worship-articles");
  revalidateTag("events");
}
