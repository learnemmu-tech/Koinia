import type { Metadata } from "next";



import { ShortsPageClient } from "@/components/shorts/shorts-page-client";

import { getChurchById } from "@/lib/church-queries";

import { resolvePageContentQuery } from "@/lib/content/page-content-query";

import { getPublishedShortsForViewer } from "@/lib/cached-shorts-data";

import { buildPageMetadata } from "@/lib/seo";

import { auth } from "@clerk/nextjs/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";

import { getAppUserByClerkId } from "@/lib/postgres/app-user";

import { userCanManageChurch } from "@/lib/postgres/session";



export const revalidate = 60;



export const metadata: Metadata = buildPageMetadata({

  title: "Video Shorts",

  description:

    "Watch and share short-form Christian videos — worship, prayer, encouragement, and church moments on FaithConnectHub.",

  path: "/shorts",

  keywords: ["Christian shorts", "faith videos", "worship clips", "church moments"],

});



export default async function ShortsPage({

  searchParams,

}: {

  searchParams: Promise<{ short?: string }>;

}) {

  const { short: initialShortId } = await searchParams;

  const session = await auth();

  const email = session.sessionClaims?.email as string | undefined;

  const { contentQuery, isPlatformPublic, tenantScope } =

    await resolvePageContentQuery();



  const [shorts, posting] = await Promise.all([
    getPublishedShortsForViewer(contentQuery, "church", {
      clerkId: session.userId ?? null,
      email,
    }),
    (async () => {
      let canPost = false;
      let createContentScope: "organization" | "platform_public" = "organization";
      let createChurchId = tenantScope?.churchId ?? "";
      let churchName = "FaithConnectHub";

      if (isPlatformPublic && session.userId) {
        const appUser = await getAppUserByClerkId(session.userId);
        if (isPlatformSuperAdmin(appUser?.platformRole)) {
          canPost = true;
          createContentScope = "platform_public";
          createChurchId = "";
        }
      } else if (tenantScope?.churchId && session.userId) {
        const [church, canManage] = await Promise.all([
          getChurchById(tenantScope.churchId),
          userCanManageChurch(session.userId, email, tenantScope.churchId),
        ]);

        churchName = church?.name?.trim() || churchName;
        createChurchId = tenantScope.churchId;

        if (canManage) {
          canPost = true;
          createContentScope = "organization";
        }
      }

      return { canPost, createContentScope, createChurchId, churchName };
    })(),
  ]);

  const { canPost, createContentScope, createChurchId, churchName } = posting;



  return (

    <ShortsPageClient

      initialShorts={shorts}

      churchName={churchName}

      canPost={canPost}

      createContentScope={createContentScope}

      createChurchId={createChurchId}

      initialShortId={initialShortId}

    />

  );

}


