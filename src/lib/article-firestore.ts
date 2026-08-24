import type { FirebaseArticle } from "@/types/firebase-article";
import { ARTICLE_CATEGORIES } from "@/types/firebase-article";

import { resolveDocumentChurchId } from "./church-scope";
import { toMillis } from "./firebase-utils";

export const ARTICLES_COLLECTION = "articles";

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveCategory(
  data: Record<string, unknown>,
  tags: string[]
): string {
  const explicit = String(data.category ?? "").trim();
  if (explicit) return explicit;

  const firstTag = tags[0]?.trim();
  if (firstTag && (ARTICLE_CATEGORIES as readonly string[]).includes(firstTag)) {
    return firstTag;
  }

  return "Christian Living";
}

export function normalizeArticleFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseArticle {
  const rawCover = String(data.coverImage ?? data.imageUrl ?? "").trim();
  const tags = normalizeTags(data.tags);

  return {
    id,
    churchId: resolveDocumentChurchId(data),
    title: String(data.title ?? ""),
    category: resolveCategory(data, tags),
    shortDescription: String(data.shortDescription ?? ""),
    scriptureReference:
      String(data.scriptureReference ?? "").trim() || undefined,
    content: String(data.content ?? ""),
    coverImage: rawCover || undefined,
    author: String(data.author ?? ""),
    authorImage:
      String(data.authorImage ?? data.authorPhoto ?? "").trim() || undefined,
    tags,
    youtubeUrl: String(data.youtubeUrl ?? data.videoUrl ?? "").trim() || undefined,
    featured: Boolean(data.featured),
    dateCreated: toMillis(data.dateCreated ?? data.createdAt),
    createdBy: String(data.createdBy ?? ""),
    isPublished: Boolean(data.isPublished),
  };
}

/** Strips article body for list/navigation payloads. */
export function toArticleListItem(article: FirebaseArticle): FirebaseArticle {
  return {
    ...article,
    content: "",
  };
}
