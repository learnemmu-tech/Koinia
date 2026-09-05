import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import {
  getArticlesByIds,
  getEventsByIds,
  getSermonsByIds,
  getSongsByIds,
  listArticles,
  listChurchMembersForAdmin,
  listDonationCampaigns,
  listDonations,
  listEvents,
  listPrayerRequests,
  listSermons,
  listSongs,
} from "@/lib/postgres/features";
import { getAllChurches, getChurchById } from "@/lib/postgres/tenants";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { filterTenantContentByIds, filterTenantContentItems } from "@/lib/tenant-content-filters";
import {
  isTenantContentCollection,
  type CollectionName,
} from "@/lib/tenant-content-types";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection")?.trim() ?? "";
  const churchId = searchParams.get("churchId")?.trim() ?? "";
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20) || 20));

  if (!isTenantContentCollection(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const isAdmin = isPlatformSuperAdmin(decoded.email);
  const viewerClerkId = decoded.uid;
  const viewerEmail = decoded.email;

  try {
    if (collection === "churches") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const churches = await getAllChurches();
      return NextResponse.json({
        items: churches.slice(offset, offset + limit),
        hasMore: churches.length > offset + limit,
      });
    }

    if (collection === "users") {
      const appUser = await getAppUserByClerkId(decoded.uid);
      const scopedChurchId = isAdmin ? churchId : appUser?.activeChurchId ?? churchId;
      if (!scopedChurchId) {
        return NextResponse.json({ items: [], hasMore: false });
      }
      if (!isAdmin) {
        const allowed = await userCanAccessChurchContent(
          decoded.uid,
          decoded.email,
          scopedChurchId
        );
        if (!allowed) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      const members = await listChurchMembersForAdmin(scopedChurchId);
      const items = members.map((member) => ({
        id: member.clerkId ?? member.userId,
        name:
          [member.firstName, member.lastName].filter(Boolean).join(" ") || "Member",
        email: member.email,
        role: member.platformRole,
        createdAt: member.createdAt.getTime(),
      }));
      return NextResponse.json({
        items: items.slice(offset, offset + limit),
        hasMore: items.length > offset + limit,
      });
    }

    const ids = searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids?.length) {
      let byId: Array<{ churchId?: string }> = [];
      switch (collection) {
        case "songs":
          byId = await getSongsByIds(ids);
          break;
        case "sermons":
          byId = await getSermonsByIds(ids);
          break;
        case "articles":
          byId = await getArticlesByIds(ids);
          break;
        case "events":
          byId = await getEventsByIds(ids);
          break;
        default:
          return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
      }

      if (!isAdmin) {
        const allowedChurchIds = new Set<string>();
        const deniedChurchIds = new Set<string>();
        const visible: typeof byId = [];
        for (const item of byId) {
          const itemChurchId = item.churchId?.trim() ?? "";
          if (!itemChurchId) continue;
          if (deniedChurchIds.has(itemChurchId)) continue;
          if (!allowedChurchIds.has(itemChurchId)) {
            const allowed = await userCanAccessChurchContent(
              decoded.uid,
              decoded.email,
              itemChurchId
            );
            if (allowed) allowedChurchIds.add(itemChurchId);
            else {
              deniedChurchIds.add(itemChurchId);
              continue;
            }
          }
          visible.push(item);
        }
        byId = visible;
      }

      const canManageByChurch = new Map<string, boolean>();
      async function canManageChurchContent(churchIdValue: string): Promise<boolean> {
        if (isAdmin) return true;
        const cached = canManageByChurch.get(churchIdValue);
        if (cached != null) return cached;
        const allowed = await userCanManageChurch(
          viewerClerkId,
          viewerEmail,
          churchIdValue
        );
        canManageByChurch.set(churchIdValue, allowed);
        return allowed;
      }

      const filtered: typeof byId = [];
      for (const item of byId) {
        const itemChurchId = item.churchId?.trim() ?? "";
        if (!itemChurchId) continue;
        const canManage = await canManageChurchContent(itemChurchId);
        const visible = filterTenantContentByIds(
          collection as CollectionName,
          [item],
          canManage
        );
        if (visible.length > 0) filtered.push(visible[0]!);
      }
      byId = filtered;

      return NextResponse.json({
        items: byId.slice(offset, offset + limit),
        hasMore: byId.length > offset + limit,
      });
    }

    if (!churchId) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const church = await getChurchById(churchId);
    if (!church) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    if (!isAdmin) {
      const allowed = await userCanAccessChurchContent(
        decoded.uid,
        decoded.email,
        churchId
      );
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const canManage =
      isAdmin ||
      (await userCanManageChurch(decoded.uid, decoded.email, churchId));

    if (collection === "donations" && !canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scope = {
      organizationId: church.organizationId ?? "",
      churchId,
      branchId: churchId,
    };

    let items: unknown[] = [];
    switch (collection) {
      case "songs":
        items = await listSongs(scope);
        break;
      case "sermons":
        items = await listSermons(scope);
        break;
      case "articles":
        items = await listArticles(scope);
        break;
      case "events":
        items = await listEvents(scope);
        break;
      case "prayerRequests":
        items = await listPrayerRequests(scope);
        break;
      case "donationCampaigns":
        items = await listDonationCampaigns(scope);
        break;
      case "donations":
        items = await listDonations(scope);
        break;
    }

    items = filterTenantContentItems(collection, items, canManage);

    return NextResponse.json({
      items: items.slice(offset, offset + limit),
      hasMore: items.length > offset + limit,
    });
  } catch (error) {
    console.error("[api/tenant-content]", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
