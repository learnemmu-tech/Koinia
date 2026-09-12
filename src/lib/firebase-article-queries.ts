import "server-only";

import {
  createArticle as insertArticle,
  deleteArticle as removeArticle,
  getArticleById as loadArticleById,
  getArticlesByIds as loadArticlesByIds,
  listArticles,
  updateArticle as saveArticle,
} from "@/lib/postgres/features";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import type {
  CreateArticleInput,
  FirebaseArticle,
  UpdateArticleInput,
} from "@/types/firebase-article";

export async function getArticles(scope: ContentQueryInput): Promise<FirebaseArticle[]> {
  return listArticles(scope);
}

export async function getPublishedArticles(
  scope: ContentQueryInput,
  options?: { limit?: number }
): Promise<FirebaseArticle[]> {
  return listArticles(scope, {
    publishedOnly: true,
    limit: options?.limit,
    resolveCreatorClerkIds: false,
  });
}

export async function getArticleById(
  articleId: string
): Promise<FirebaseArticle | null> {
  return loadArticleById(articleId);
}

export async function getArticlesByIds(ids: string[]): Promise<FirebaseArticle[]> {
  return loadArticlesByIds(ids);
}

export async function searchArticles(
  scope: ContentQueryInput,
  searchQuery: string
): Promise<FirebaseArticle[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];
  const articles = await getPublishedArticles(scope);
  return articles.filter((article) =>
    [article.title, article.author, article.category, article.shortDescription]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export async function createArticle(input: CreateArticleInput): Promise<string> {
  return insertArticle(input);
}

export async function updateArticle(
  articleId: string,
  updates: UpdateArticleInput
): Promise<void> {
  await saveArticle(articleId, updates);
}

export async function deleteArticle(articleId: string): Promise<void> {
  await removeArticle(articleId);
}
