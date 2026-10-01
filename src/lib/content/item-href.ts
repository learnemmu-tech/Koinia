export function contentItemHref(collectionBase: string, id: string): string {
  const base = collectionBase.replace(/\/$/, "") || "";
  return `${base}/${encodeURIComponent(id)}`;
}
