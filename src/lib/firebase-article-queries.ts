import "server-only";

import {
  createArticle as insertArticle,
  deleteArticle as removeArticle,
  getArticleById as loadArticleById,
  getArticlesByIds as loadArticlesByIds,
  listArticles,
  updateArticle as saveArticle,
} from "@/lib/postgres/features";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type {
  CreateArticleInput,
  FirebaseArticle,
  UpdateArticleInput,
} from "@/types/firebase-article";

export async function getArticles(scope: TenantScope): Promise<FirebaseArticle[]> {
  return listArticles(scope);
}

export async function getPublishedArticles(
  scope: TenantScope
): Promise<FirebaseArticle[]> {
  return (await listArticles(scope)).filter((article) => article.isPublished);
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
  scope: TenantScope,
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
