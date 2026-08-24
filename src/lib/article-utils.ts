import type { FirebaseArticle } from "@/types/firebase-article";

const WORDS_PER_MINUTE = 200;

export function getReadingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatArticleDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getRelatedArticles(
  articles: FirebaseArticle[],
  currentId: string,
  limit = 3
): FirebaseArticle[] {
  const current = articles.find((a) => a.id === currentId);
  if (!current) return articles.filter((a) => a.id !== currentId).slice(0, limit);

  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));
  const currentCategory = current.category.trim().toLowerCase();

  return articles
    .filter((a) => a.id !== currentId)
    .map((article) => {
      const sharedTags = article.tags.filter((tag) =>
        currentTags.has(tag.toLowerCase())
      ).length;
      const categoryMatch =
        currentCategory &&
        article.category.trim().toLowerCase() === currentCategory
          ? 2
          : 0;
      return { article, score: sharedTags + categoryMatch };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.article.dateCreated - a.article.dateCreated;
    })
    .slice(0, limit)
    .map(({ article }) => article);
}

export function getArticleNeighbors(
  articles: FirebaseArticle[],
  currentId: string
): {
  previous: FirebaseArticle | null;
  next: FirebaseArticle | null;
} {
  const sorted = [...articles].sort((a, b) => b.dateCreated - a.dateCreated);
  const index = sorted.findIndex((a) => a.id === currentId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? sorted[index - 1]! : null,
    next: index < sorted.length - 1 ? sorted[index + 1]! : null,
  };
}
