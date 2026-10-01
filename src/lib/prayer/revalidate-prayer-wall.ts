import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { contentCacheKey, tenantContentQuery } from "@/lib/content/content-scope";
import { getChurchById } from "@/lib/postgres/tenants";
import { churchWebsitePath } from "@/lib/templates/paths";

/** Drop cached prayer lists so church walls and the platform wall see new approvals. */
export async function revalidatePrayerWall(churchId: string | null | undefined) {
  revalidateTag("prayer-requests");
  revalidatePath("/prayer-requests");

  const id = churchId?.trim();
  if (!id) return;

  const church = await getChurchById(id);
  if (!church) return;

  if (church.organizationId) {
    revalidateTag(
      `content-${contentCacheKey(
        tenantContentQuery({
          organizationId: church.organizationId,
          churchId: church.id,
          branchId: church.id,
        })
      )}`
    );
  }

  if (church.slug) {
    revalidatePath(churchWebsitePath(church.slug, "/prayer"));
    revalidatePath(churchWebsitePath(church.slug));
  }
}
