import type { Firestore as AdminFirestore } from "firebase-admin/firestore";

import {

  query,

  where,

  type CollectionReference,

  type DocumentData,

  type Query,

  type QueryConstraint,

} from "firebase/firestore";



import type { TenantScope } from "@/lib/organization/tenant-scope";



export type WorkspaceTenantScope = Required<

  Pick<TenantScope, "organizationId" | "churchId" | "branchId">

>;



export function isWorkspaceTenantScopeComplete(

  scope: Partial<TenantScope>

): scope is WorkspaceTenantScope {

  return Boolean(

    scope.organizationId?.trim() &&

      scope.churchId?.trim() &&

      scope.branchId?.trim()

  );

}



/** Client SDK — workspace tenant query (org + church + optional extra constraints). */

export function buildWorkspaceTenantQuery(

  col: CollectionReference<DocumentData>,

  scope: Partial<TenantScope>,

  ...constraints: QueryConstraint[]

): Query<DocumentData> | null {

  if (!isWorkspaceTenantScopeComplete(scope)) return null;



  const base: QueryConstraint[] = [

    where("organizationId", "==", scope.organizationId.trim()),

    where("churchId", "==", scope.churchId.trim()),

    where("branchId", "==", scope.branchId.trim()),

  ];



  return query(col, ...base, ...constraints);

}



/**

 * Client SDK — org + church indexed query; branch matched in memory for legacy docs.

 * Use when branchId may be missing on unmigrated documents.

 */

export function buildWorkspaceChurchTenantQuery(

  col: CollectionReference<DocumentData>,

  scope: Partial<TenantScope>,

  ...constraints: QueryConstraint[]

): Query<DocumentData> | null {

  const organizationId = scope.organizationId?.trim();

  const churchId = scope.churchId?.trim();

  if (!organizationId || !churchId) return null;



  return query(

    col,

    where("organizationId", "==", organizationId),

    where("churchId", "==", churchId),

    ...constraints

  );

}



/** Client SDK — church-scoped query; org/branch matched in memory. */

export function buildChurchScopedQuery(

  col: CollectionReference<DocumentData>,

  churchId: string | null | undefined,

  ...constraints: QueryConstraint[]

): Query<DocumentData> | null {

  const resolvedChurchId = churchId?.trim();

  if (!resolvedChurchId) return null;



  return query(col, where("churchId", "==", resolvedChurchId), ...constraints);

}



/** Admin SDK — workspace tenant query. */

export function buildAdminWorkspaceTenantQuery(

  adminDb: AdminFirestore,

  collectionName: string,

  scope: Partial<TenantScope>,

  orderField: string,

  direction: "asc" | "desc" = "desc"

) {

  if (!isWorkspaceTenantScopeComplete(scope)) return null;



  return adminDb

    .collection(collectionName)

    .where("organizationId", "==", scope.organizationId.trim())

    .where("churchId", "==", scope.churchId.trim())

    .where("branchId", "==", scope.branchId.trim())

    .orderBy(orderField, direction);

}



/** Admin SDK — org + church query (branch filter in memory). */

export function buildAdminWorkspaceChurchTenantQuery(

  adminDb: AdminFirestore,

  collectionName: string,

  scope: Partial<TenantScope>,

  orderField: string,

  direction: "asc" | "desc" = "desc"

) {

  const organizationId = scope.organizationId?.trim();

  const churchId = scope.churchId?.trim();

  if (!organizationId || !churchId) return null;



  return adminDb

    .collection(collectionName)

    .where("organizationId", "==", organizationId)

    .where("churchId", "==", churchId)

    .orderBy(orderField, direction);

}


