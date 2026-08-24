export type FirebaseArticle = {
  id: string;
  churchId: string;
  title: string;
  category: string;
  shortDescription: string;
  scriptureReference?: string;
  content: string;
  coverImage?: string;
  author: string;
  authorImage?: string;
  tags: string[];
  youtubeUrl?: string;
  featured: boolean;
  dateCreated: number;
  createdBy: string;
  isPublished: boolean;
};

export type CreateArticleInput = {
  churchId: string;
  title: string;
  category: string;
  shortDescription: string;
  scriptureReference?: string;
  content: string;
  coverImage?: string;
  author: string;
  tags?: string[];
  youtubeUrl?: string;
  featured?: boolean;
  createdBy: string;
  isPublished: boolean;
};

export type UpdateArticleInput = Partial<
  Omit<CreateArticleInput, "createdBy">
>;

export const ARTICLE_CATEGORIES = [
  "Bible Study",
  "Prayer",
  "Worship",
  "Faith",
  "Christian Living",
  "Testimony",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
