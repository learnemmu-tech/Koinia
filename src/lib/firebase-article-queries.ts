"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type {
  CreateArticleInput,
  FirebaseArticle,
  UpdateArticleInput,
} from "@/types/firebase-article";

import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import type { TenantScope } from "./organization/tenant-scope";
import { fetchTenantCollection } from "./tenant-content-server";
import { mergeTenantFieldsIntoPayload } from "./organization/resolve-tenant-scope";
import {
  isRecoverableAdminError,
  wrapFirebaseError,
} from "./firebase-utils";
import {
  ARTICLES_COLLECTION,
  normalizeArticleFromFirestore,
} from "./article-firestore";

function normalizeArticle(
  id: string,
  data: Record<string, unknown>
): FirebaseArticle {
  return normalizeArticleFromFirestore(id, data);
}

async function fetchAllArticlesForScope(
  scope: TenantScope
): Promise<FirebaseArticle[]> {
  return fetchTenantCollection(ARTICLES_COLLECTION, scope, normalizeArticle, {
    orderField: "dateCreated",
    defaultBranchId: scope.branchId ?? null,
  });
}

export async function getArticles(scope: TenantScope): Promise<FirebaseArticle[]> {
  return fetchAllArticlesForScope(scope);
}

export async function getPublishedArticles(
  scope: TenantScope
): Promise<FirebaseArticle[]> {
  const articles = await fetchAllArticlesForScope(scope);
  return articles.filter((a) => a.isPublished);
}

export async function getArticleById(
  articleId: string
): Promise<FirebaseArticle | null> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(ARTICLES_COLLECTION)
        .doc(articleId)
        .get();

      if (!snapshot.exists) return null;

      return normalizeArticle(
        snapshot.id,
        snapshot.data() as Record<string, unknown>
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const snapshot = await getDoc(doc(db, ARTICLES_COLLECTION, articleId));
    if (!snapshot.exists()) return null;

    return normalizeArticle(
      snapshot.id,
      snapshot.data() as Record<string, unknown>
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function searchArticles(
  scope: TenantScope,
  searchQuery: string
): Promise<FirebaseArticle[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];

  const articles = await getPublishedArticles(scope);
  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.category,
      article.author,
      article.scriptureReference ?? "",
      article.shortDescription,
      ...article.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function createArticle(
  articleData: CreateArticleInput
): Promise<string> {
  const adminDb = getAdminDb();
  const scopedPayload = await mergeTenantFieldsIntoPayload(
    articleData as Record<string, unknown>,
    articleData.churchId
  );
  const payload = {
    ...scopedPayload,
    dateCreated: FieldValue.serverTimestamp(),
  };

  if (adminDb) {
    try {
      const docRef = await adminDb.collection(ARTICLES_COLLECTION).add(payload);
      return docRef.id;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const clientPayload = await mergeTenantFieldsIntoPayload(
      articleData as Record<string, unknown>,
      articleData.churchId
    );
    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
      ...clientPayload,
      dateCreated: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateArticle(
  articleId: string,
  updates: UpdateArticleInput
): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(ARTICLES_COLLECTION).doc(articleId).update(updates);
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await updateDoc(doc(db, ARTICLES_COLLECTION, articleId), updates);
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function deleteArticle(articleId: string): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(ARTICLES_COLLECTION).doc(articleId).delete();
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
