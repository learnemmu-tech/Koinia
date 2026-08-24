/** Data stays fresh for 2 minutes — avoids refetch on every navigation. */
export const QUERY_STALE_TIME = 1000 * 60 * 2;

/** Keep unused query data in cache for 5 minutes. */
export const QUERY_GC_TIME = 1000 * 60 * 5;

export const DEFAULT_LIST_LIMIT = 20;
export const MEMBERS_LIST_LIMIT = 50;
