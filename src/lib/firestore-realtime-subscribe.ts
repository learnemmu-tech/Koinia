import {
  onSnapshot,
  orderBy,
  query,
  type CollectionReference,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { isFirebaseIndexError, isFirebasePermissionError } from "./firebase-utils";

type SubscribeCollectionOptions<T> = {
  mapSnapshot: (snapshot: QuerySnapshot<DocumentData>) => T[];
  sortResults?: (items: T[]) => T[];
  onData: (items: T[]) => void;
  onError: (message: string) => void;
  onReady?: () => void;
};

function getSyncErrorMessage(error: unknown, label: string): string {
  if (isFirebasePermissionError(error)) {
    return `Unable to sync ${label}. Deploy firestore rules and sign in with your admin Firebase account.`;
  }

  if (isFirebaseIndexError(error)) {
    return `Unable to sync ${label}. Deploy Firestore indexes: firebase deploy --only firestore:indexes`;
  }

  return `Unable to sync ${label}.`;
}

export function subscribeCollectionWithFallback<T>(
  col: CollectionReference<DocumentData>,
  orderField: string,
  options: SubscribeCollectionOptions<T>
): Unsubscribe {
  const { mapSnapshot, sortResults, onData, onError, onReady } = options;
  let fallbackUnsub: Unsubscribe | undefined;
  let stopped = false;

  const orderedQuery = query(col, orderBy(orderField, "desc"));

  const emit = (snapshot: QuerySnapshot<DocumentData>) => {
    let items = mapSnapshot(snapshot);
    if (sortResults) {
      items = sortResults(items);
    }
    onData(items);
    onReady?.();
  };

  const orderedUnsub = onSnapshot(
    orderedQuery,
    emit,
    (error) => {
      console.error(`[Firestore] ${col.path} ordered sync failed`, error);

      if (stopped) return;

      if (isFirebasePermissionError(error)) {
        onError(getSyncErrorMessage(error, col.path));
        onReady?.();
        return;
      }

      if (isFirebaseIndexError(error)) {
        fallbackUnsub = onSnapshot(
          col,
          emit,
          (fallbackError) => {
            console.error(`[Firestore] ${col.path} fallback sync failed`, fallbackError);
            onError(getSyncErrorMessage(fallbackError, col.path));
            onReady?.();
          }
        );
        return;
      }

      onError(getSyncErrorMessage(error, col.path));
      onReady?.();
    }
  );

  return () => {
    stopped = true;
    orderedUnsub();
    fallbackUnsub?.();
  };
}
