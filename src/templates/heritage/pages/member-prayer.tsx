import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { PrayerRequestDetailClient } from "@/components/prayer/prayer-request-detail-client";
import { tenantContentQuery } from "@/lib/content/content-scope";
import { listApprovedPrayerRequests } from "@/lib/prayer-request-queries.server";
import { loadReadablePrayerRequest } from "@/lib/prayer/prayer-authorization";
import { userCanAccessChurchContent } from "@/lib/postgres/session";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import { HeritageActiveChurchSync } from "@/templates/heritage/components/heritage-member-app-redirect";
import {
  HeritageContentFrame,
  HeritageDetailFrame,
} from "@/templates/heritage/components/heritage-content-frame";
import { HeritageMemberGate } from "@/templates/heritage/components/heritage-member-gate";
import { HeritagePrayerWall } from "@/templates/heritage/components/heritage-prayer-wall";
import { HeritageSharePrayerDialog } from "@/templates/heritage/components/heritage-share-prayer-dialog";
import { heritageLoginHref } from "@/templates/heritage/lib";
import {
  heritagePrayerDetailPath,
  heritagePrayerPath,
  isPrayerRequestVisibleOnChurchWall,
  requestBelongsToChurch,
  resolveHeritagePrayerView,
} from "@/templates/heritage/prayer";

/**
 * Server-side gate. Returns the signed-in user only when they hold an active
 * membership (or administrative access) for THIS church. The active-church
 * cookie and the user's profile church are intentionally not consulted: the
 * church is always the one in the URL.
 */
export async function getHeritagePrayerViewer(churchId: string) {
  const session = await auth();
  if (!session.userId) {
    return { userId: null, email: undefined, hasChurchAccess: false } as const;
  }
  const email =
    typeof session.sessionClaims?.email === "string"
      ? session.sessionClaims.email
      : undefined;
  const hasChurchAccess = await userCanAccessChurchContent(
    session.userId,
    email,
    churchId
  );
  return { userId: session.userId, email, hasChurchAccess } as const;
}

export async function shouldShowHeritageMemberPrayer(
  model: ChurchWebsiteViewModel
) {
  const viewer = await getHeritagePrayerViewer(model.church.id);
  return (
    resolveHeritagePrayerView({
      isAuthenticated: Boolean(viewer.userId),
      hasChurchAccess: viewer.hasChurchAccess,
    }) === "wall"
  );
}

export async function HeritageMemberPrayerPage({
  model,
}: {
  model: ChurchWebsiteViewModel;
}) {
  const churchId = model.church.id;
  const slug = model.church.slug;

  let requests: FirebasePrayerRequest[] = [];
  let loadFailed = false;
  try {
    const organizationId = model.church.organizationId?.trim() ?? "";
    if (organizationId) {
      const approved = await listApprovedPrayerRequests(
        tenantContentQuery({ organizationId, churchId, branchId: churchId })
      );
      // Defence in depth: never render a request from another church.
      requests = approved.filter((request) =>
        isPrayerRequestVisibleOnChurchWall(request, churchId)
      );
    }
  } catch (error) {
    console.error("[heritage-prayer] failed to load prayer wall", error);
    loadFailed = true;
  }

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow="Prayer"
      title="Prayer wall"
      description={`Lift up the needs of the ${model.church.name} family, and share your own. Requests are reviewed by church leaders before they appear here.`}
      action={<HeritageSharePrayerDialog model={model} />}
    >
      <HeritageActiveChurchSync churchId={churchId} />
      <HeritagePrayerWall
        slug={slug}
        churchId={churchId}
        initialRequests={requests}
        loadFailed={loadFailed}
      />
    </HeritageContentFrame>
  );
}

export async function HeritagePrayerDetailPage({
  model,
  requestId,
}: {
  model: ChurchWebsiteViewModel;
  requestId: string;
}) {
  const churchId = model.church.id;
  const detailPath = heritagePrayerDetailPath(model.church.slug, requestId);
  const viewer = await getHeritagePrayerViewer(churchId);

  if (!viewer.userId) {
    redirect(heritageLoginHref(model, detailPath));
  }
  if (!viewer.hasChurchAccess) {
    return <HeritageMemberGate model={model} featureLabel="Prayer requests" />;
  }

  // Same shared gate as the platform page, then pinned to the church in the URL.
  const request = await loadReadablePrayerRequest(requestId);
  if (!request || !requestBelongsToChurch(request, churchId)) {
    // Same response for "missing" and "belongs to another church": no leaking.
    notFound();
  }

  return (
    <HeritageDetailFrame>
      <HeritageActiveChurchSync churchId={churchId} />
      <PrayerRequestDetailClient
        requestId={request.id}
        initialRequest={request}
        backHref={heritagePrayerPath(model.church.slug)}
        sharePath={detailPath}
      />
    </HeritageDetailFrame>
  );
}
