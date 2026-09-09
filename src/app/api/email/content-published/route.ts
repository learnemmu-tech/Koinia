import { after, NextResponse } from "next/server";
import { z } from "zod";

import { verifyChurchContentPublisher } from "@/lib/auth/verify-church-content-publisher";
import {
  triggerContentAnnouncementEmails,
  type ContentPublishEmailType,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  getArticleById,
  getDonationCampaignById,
  getSermonById,
  getSongById,
} from "@/lib/postgres/features";
import { userCanManageChurch } from "@/lib/postgres/session";

const bodySchema = z.object({
  type: z.enum(["song", "sermon", "article", "donation_campaign"]),
  contentId: z.string().trim().min(1),
});

async function resolveContentChurchId(
  type: ContentPublishEmailType,
  contentId: string
): Promise<string | null> {
  switch (type) {
    case "song": {
      const song = await getSongById(contentId);
      return song?.churchId ?? null;
    }
    case "sermon": {
      const sermon = await getSermonById(contentId);
      return sermon?.churchId ?? null;
    }
    case "article": {
      const article = await getArticleById(contentId);
      return article?.churchId ?? null;
    }
    case "donation_campaign": {
      const campaign = await getDonationCampaignById(contentId);
      return campaign?.churchId ?? null;
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canPublish = await verifyChurchContentPublisher(
    authUser.uid,
    authUser.email
  );

  if (!canPublish) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const churchId = await resolveContentChurchId(
    body.type as ContentPublishEmailType,
    body.contentId
  );
  if (!churchId) {
    return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  const mayAnnounce = await userCanManageChurch(
    authUser.uid,
    authUser.email,
    churchId
  );
  if (!mayAnnounce) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  after(() =>
    triggerContentAnnouncementEmails(
      body.type as ContentPublishEmailType,
      body.contentId,
      authUser.uid
    ).catch((error) => {
      console.error("[api/email/content-published]", error);
    })
  );

  return NextResponse.json({ success: true });
}
