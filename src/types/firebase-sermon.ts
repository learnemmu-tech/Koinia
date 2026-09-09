export type FirebaseSermon = {
  id: string;
  contentScope?: "organization" | "platform_public";
  organizationId?: string;
  churchId: string;
  title: string;
  subtitle?: string;
  scriptureReference: string;
  speaker: string;
  shortDescription: string;
  content: string;
  tags: string[];
  youtubeUrl?: string;
  audioUrl?: string;
  coverImage?: string;
  dateCreated: number;
  createdBy: string;
  isPublished: boolean;
};

export type CreateSermonInput = {
  contentScope?: "organization" | "platform_public";
  churchId: string;
  title: string;
  subtitle?: string;
  scriptureReference: string;
  speaker: string;
  shortDescription: string;
  content: string;
  tags?: string[];
  youtubeUrl?: string;
  audioUrl?: string;
  coverImage?: string;
  createdBy: string;
  isPublished: boolean;
};

export type UpdateSermonInput = Partial<
  Omit<CreateSermonInput, "createdBy">
>;
