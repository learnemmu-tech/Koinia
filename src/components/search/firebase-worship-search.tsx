"use client";

import { GlobalSearchResults } from "./global-search-results";

type FirebaseWorshipSearchProps = {
  query: string;
};

/** @deprecated Use GlobalSearchResults directly. Kept for existing imports. */
export function FirebaseWorshipSearch({ query }: FirebaseWorshipSearchProps) {
  return <GlobalSearchResults query={query} />;
}
