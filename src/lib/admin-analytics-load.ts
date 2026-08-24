import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonation } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";
import {
  DONATIONS_COLLECTION,
  normalizeDonationFromFirestore,
} from "@/lib/donation-firestore";
import {
  EVENTS_COLLECTION,
  normalizeEventFromFirestore,
} from "@/lib/event-firestore";
import { db } from "@/lib/firebase";
import { normalizePrayerRequestFromFirestore } from "@/lib/prayer-request-firestore";
import {
  LEGACY_SERMONS_COLLECTION,
  mergeSermonsById,
  normalizeSermonFromFirestore,
  SERMONS_COLLECTION,
} from "@/lib/sermon-firestore";
import { normalizeSongFromFirestore } from "@/lib/song-firestore";
import { DEFAULT_LIST_LIMIT } from "@/lib/react-query-config";

function buildScopedQuery(
  collectionName: string,
  churchScope: string | null,
  orderField: string,
  direction: "asc" | "desc" = "desc"
) {
  const constraints: QueryConstraint[] = [];
  if (churchScope?.trim()) {
    constraints.push(where("churchId", "==", churchScope.trim()));
  }
  constraints.push(orderBy(orderField, direction));
  constraints.push(limit(DEFAULT_LIST_LIMIT));
  return query(collection(db, collectionName), ...constraints);
}

export type AdminAnalyticsCollections = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  events: FirebaseEvent[];
  prayerRequests: FirebasePrayerRequest[];
  donations: FirebaseDonation[];
  userCount: number;
};

export async function loadAdminAnalyticsCollections(
  churchScope: string | null
): Promise<AdminAnalyticsCollections> {
  const [
    songsSnap,
    sermonsSnap,
    legacySermonsSnap,
    articlesSnap,
    eventsSnap,
    prayersSnap,
    donationsSnap,
    userCountSnap,
  ] = await Promise.all([
    getDocs(buildScopedQuery("songs", churchScope, "createdAt")),
    getDocs(buildScopedQuery(SERMONS_COLLECTION, churchScope, "dateCreated")),
    getDocs(
      buildScopedQuery(LEGACY_SERMONS_COLLECTION, churchScope, "dateCreated")
    ),
    getDocs(buildScopedQuery("articles", churchScope, "dateCreated")),
    getDocs(buildScopedQuery(EVENTS_COLLECTION, churchScope, "eventDate", "desc")),
    getDocs(buildScopedQuery("prayerRequests", churchScope, "createdAt")),
    getDocs(buildScopedQuery(DONATIONS_COLLECTION, churchScope, "createdAt")),
    churchScope?.trim() ?
      getCountFromServer(
        query(collection(db, "users"), where("churchId", "==", churchScope.trim()))
      )
    : getCountFromServer(collection(db, "users")),
  ]);

  const songs = songsSnap.docs.map((docSnap) =>
    normalizeSongFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
  );

  const sermons = mergeSermonsById([
    sermonsSnap.docs.map((docSnap) =>
      normalizeSermonFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
    legacySermonsSnap.docs.map((docSnap) =>
      normalizeSermonFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
  ]);

  const scopedSermons =
    churchScope ?
      sermons.filter((item) => item.churchId === churchScope)
    : sermons;

  return {
    songs,
    sermons: scopedSermons,
    articles: articlesSnap.docs.map((docSnap) =>
      normalizeArticleFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
    events: eventsSnap.docs.map((docSnap) =>
      normalizeEventFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
    prayerRequests: prayersSnap.docs.map((docSnap) =>
      normalizePrayerRequestFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    ),
    donations: donationsSnap.docs.map((docSnap) =>
      normalizeDonationFromFirestore(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
    userCount: userCountSnap.data().count,
  };
}
