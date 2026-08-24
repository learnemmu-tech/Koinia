import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import {
  query,
  where,
  orderBy,
  type CollectionReference,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";

/** Client SDK — church-scoped ordered query (always filters when churchId is set). */
export function buildChurchScopedQuery(
  col: CollectionReference<DocumentData>,
  churchId: string,
  orderField: string,
  direction: "asc" | "desc" = "desc"
): Query<DocumentData> {
  const scopedId = churchId.trim();
  if (!scopedId) {
    return query(col, orderBy(orderField, direction));
  }

  return query(
    col,
    where("churchId", "==", scopedId),
    orderBy(orderField, direction)
  );
}

/** Client SDK — optional church scope plus additional constraints. */
export function buildClientScopedQuery(
  col: CollectionReference<DocumentData>,
  churchId: string | null | undefined,
  ...constraints: QueryConstraint[]
): Query<DocumentData> {
  const allConstraints: QueryConstraint[] = [];
  const scopedId = churchId?.trim();

  if (scopedId) {
    allConstraints.push(where("churchId", "==", scopedId));
  }

  allConstraints.push(...constraints);
  return query(col, ...allConstraints);
}

/** Admin SDK — church-scoped ordered query. */
export function buildAdminChurchScopedQuery(
  adminDb: AdminFirestore,
  collectionName: string,
  churchId: string,
  orderField: string,
  direction: "asc" | "desc" = "desc"
) {
  const collectionRef = adminDb.collection(collectionName);
  const scopedId = churchId.trim();

  if (!scopedId) {
    return collectionRef.orderBy(orderField, direction);
  }

  return collectionRef
    .where("churchId", "==", scopedId)
    .orderBy(orderField, direction);
}

export function appendChurchIdToPayload<T extends Record<string, unknown>>(
  payload: T,
  churchId: string
): T & { churchId: string } {
  return { ...payload, churchId };
}
