import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  addSong,
  createArticle,
  createEvent,
  createSermon,
  deleteArticle,
  deleteEvent,
  deleteSermon,
  deleteSong,
  getArticleById,
  getEventById,
  getSermonById,
  getSongById,
  updateArticle,
  updateEvent,
  updateSermon,
  updateSong,
} from "@/lib/postgres/content-mutations";
import { userCanManageChurch } from "@/lib/postgres/session";
import { timed } from "@/lib/perf";
import type { CreateArticleInput, UpdateArticleInput } from "@/types/firebase-article";
import type { CreateEventInput, UpdateEventInput } from "@/types/firebase-event";
import type { CreateSermonInput, UpdateSermonInput } from "@/types/firebase-sermon";
import type { CreateSongInput, UpdateSongInput } from "@/types/firebase-song";

const COLLECTIONS = ["songs", "sermons", "articles", "events"] as const;
type CollectionName = (typeof COLLECTIONS)[number];
type Op = "create" | "update" | "delete";

type MutateBody = {
  collection?: string;
  op?: string;
  id?: string;
  churchId?: string;
  data?: Record<string, unknown>;
};

function isCollection(value: string): value is CollectionName {
  return (COLLECTIONS as readonly string[]).includes(value);
}

async function churchIdForRecord(
  collection: CollectionName,
  id: string
): Promise<string | null> {
  switch (collection) {
    case "songs":
      return (await getSongById(id))?.churchId ?? null;
    case "sermons":
      return (await getSermonById(id))?.churchId ?? null;
    case "articles":
      return (await getArticleById(id))?.churchId ?? null;
    case "events":
      return (await getEventById(id))?.churchId ?? null;
  }
}

export async function POST(request: Request) {
  const totalStarted = Date.now();
  const marks: Record<string, number> = {};

  const decoded = await timed("content.auth", () => verifyBearerToken(request));
  marks.auth = Date.now() - totalStarted;
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: MutateBody;
  try {
    body = (await request.json()) as MutateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const collection = body.collection?.trim() ?? "";
  const op = body.op?.trim() as Op | undefined;
  if (!isCollection(collection) || !op) {
    return NextResponse.json({ error: "Invalid collection or op." }, { status: 400 });
  }

  try {
    const authzStarted = Date.now();
    const churchId =
      op === "create"
        ? body.churchId?.trim() ||
          (typeof body.data?.churchId === "string" ? body.data.churchId : "")
        : body.id
          ? await churchIdForRecord(collection, body.id)
          : null;

    if (!churchId) {
      return NextResponse.json({ error: "Church not found." }, { status: 400 });
    }

    const allowed = await userCanManageChurch(
      decoded.uid,
      decoded.email,
      churchId
    );
    marks.authz = Date.now() - authzStarted;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mutateStarted = Date.now();
    if (op === "create") {
      const data = body.data ?? {};
      let id: string;
      switch (collection) {
        case "songs":
          id = await addSong(churchId, data as CreateSongInput);
          break;
        case "sermons":
          id = await createSermon({
            ...(data as CreateSermonInput),
            churchId,
            createdBy: decoded.uid,
          });
          break;
        case "articles":
          id = await createArticle({
            ...(data as CreateArticleInput),
            churchId,
            createdBy: decoded.uid,
          });
          break;
        case "events":
          id = await createEvent({
            ...(data as CreateEventInput),
            churchId,
          });
          break;
      }
      marks.mutate = Date.now() - mutateStarted;
      console.info(
        `[PERF] POST /api/content create/${collection} auth=${marks.auth}ms authz=${marks.authz}ms mutate=${marks.mutate}ms total=${Date.now() - totalStarted}ms`
      );
      return NextResponse.json({ id });
    }

    const recordId = body.id?.trim();
    if (!recordId) {
      return NextResponse.json({ error: "Missing id." }, { status: 400 });
    }

    if (op === "delete") {
      switch (collection) {
        case "songs":
          await deleteSong(recordId);
          break;
        case "sermons":
          await deleteSermon(recordId);
          break;
        case "articles":
          await deleteArticle(recordId);
          break;
        case "events":
          await deleteEvent(recordId);
          break;
      }
      marks.mutate = Date.now() - mutateStarted;
      console.info(
        `[PERF] POST /api/content delete/${collection} auth=${marks.auth}ms authz=${marks.authz}ms mutate=${marks.mutate}ms total=${Date.now() - totalStarted}ms`
      );
      return NextResponse.json({ ok: true });
    }

    const data = body.data ?? {};
    switch (collection) {
      case "songs":
        await updateSong(recordId, data as UpdateSongInput);
        break;
      case "sermons":
        await updateSermon(recordId, data as UpdateSermonInput);
        break;
      case "articles":
        await updateArticle(recordId, data as UpdateArticleInput);
        break;
      case "events":
        await updateEvent(recordId, data as UpdateEventInput);
        break;
    }
    marks.mutate = Date.now() - mutateStarted;
    console.info(
      `[PERF] POST /api/content update/${collection} auth=${marks.auth}ms authz=${marks.authz}ms mutate=${marks.mutate}ms total=${Date.now() - totalStarted}ms`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/content]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save content." },
      { status: 500 }
    );
  }
}
