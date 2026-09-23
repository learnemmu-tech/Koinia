import type { Metadata } from "next";

import { VideosPageClient } from "@/components/videos/videos-page-client";
import { getChurchById } from "@/lib/church-queries";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";
import { getChurchVideosForViewer } from "@/lib/cached-videos-data";
import { listPendingReviewShorts } from "@/lib/postgres/shorts";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";
import { auth } from "@clerk/nextjs/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Videos",
  description:
    "Watch official church videos and short-form community clips on FaithConnectHub.",
  path: "/videos",
  keywords: ["church videos", "Christian shorts", "worship videos"],
});

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; short?: string }>;
}) {
  const { short: initialShortId } = await searchParams;
  const session = await auth();
  const email = session.sessionClaims?.email as string | undefined;
  const { contentQuery, isPlatformPublic, tenantScope } =
    await resolvePageContentQuery();

  const [videos, shorts, posting] = await Promise.all([
    getChurchVideosForViewer(contentQuery, {
      clerkId: session.userId ?? null,
      email,
      includeUnpublished: Boolean(session.userId),
    }),
    getPublishedShortsForViewer(contentQuery, "church", {
      clerkId: session.userId ?? null,
      email,
    }),
    (async () => {
      let canManageVideos = false;
      let canManageShorts = false;
      let canSubmitShorts = false;
      let createContentScope: "organization" | "platform_public" = "organization";
      let createChurchId = tenantScope?.churchId ?? "";
      let churchName = "FaithConnectHub";
      let pendingShorts: Awaited<ReturnType<typeof listPendingReviewShorts>> = [];

      if (isPlatformPublic && session.userId) {
        const appUser = await getAppUserByClerkId(session.userId);
        if (isPlatformSuperAdmin(appUser?.platformRole)) {
          canManageVideos = true;
          canManageShorts = true;
          createContentScope = "platform_public";
          createChurchId = "";
        }
      } else if (tenantScope?.churchId && session.userId) {
        const [church, canManage, canAccess] = await Promise.all([
          getChurchById(tenantScope.churchId),
          userCanManageChurch(session.userId, email, tenantScope.churchId),
          userCanAccessChurchContent(session.userId, email, tenantScope.churchId),
        ]);

        churchName = church?.name?.trim() || churchName;
        createChurchId = tenantScope.churchId;
        canManageVideos = canManage;
        canManageShorts = canManage;
        canSubmitShorts = canAccess;
        createContentScope = "organization";

        if (canManage) {
          pendingShorts = await listPendingReviewShorts({
            clerkId: session.userId,
            email,
            churchId: tenantScope.churchId,
          });
        }
      }

      return {
        canManageVideos,
        canManageShorts,
        canSubmitShorts,
        createContentScope,
        createChurchId,
        churchName,
        pendingShorts,
      };
    })(),
  ]);

  return (
    <section className={pageContentClass} aria-labelledby="videos-heading">
      <VideosPageClient
        initialVideos={videos}
        initialShorts={shorts}
        churchName={posting.churchName}
        canManageVideos={posting.canManageVideos}
        canManageShorts={posting.canManageShorts}
        canSubmitShorts={posting.canSubmitShorts}
        createContentScope={posting.createContentScope}
        createChurchId={posting.createChurchId}
        churchId={tenantScope?.churchId ?? ""}
        initialShortId={initialShortId}
        pendingShorts={posting.pendingShorts}
      />
    </section>
  );
}
