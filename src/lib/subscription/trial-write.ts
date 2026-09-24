export type TrialWriteAction =
  | "create"
  | "edit"
  | "publish"
  | "upload"
  | "delete"
  | "manage";

export type TrialWriteResource =
  | "song"
  | "sermon"
  | "article"
  | "event"
  | "book"
  | "video"
  | "short"
  | "upload"
  | "group"
  | "donation"
  | "prayer"
  | "church"
  | "content";

export type TrialWriteRequest = {
  action: TrialWriteAction;
  resource: TrialWriteResource;
  contentScope?: "organization" | "platform_public" | string | null;
};

const RESOURCE_LABELS: Record<TrialWriteResource, string> = {
  song: "songs",
  sermon: "sermons",
  article: "articles",
  event: "events",
  book: "books",
  video: "videos",
  short: "Shorts",
  upload: "uploads",
  group: "groups",
  donation: "donation campaigns",
  prayer: "prayer requests",
  church: "church settings",
  content: "content",
};

const ACTION_VERBS: Record<TrialWriteAction, string> = {
  create: "Creating new",
  edit: "Editing",
  publish: "Publishing",
  upload: "Uploading new",
  delete: "Deleting",
  manage: "Managing",
};

export function isProtectedTrialWrite(request: TrialWriteRequest): boolean {
  return request.contentScope !== "platform_public";
}

export function getTrialWriteUnavailableMessage(
  request: TrialWriteRequest
): string {
  const resource = RESOURCE_LABELS[request.resource];
  if (request.action === "upload" || request.resource === "upload") {
    return "Uploading new content is currently unavailable while your church is in read-only mode.";
  }
  if (request.action === "create") {
    return `Your church's 14-day free trial has ended. Creating new ${resource} is currently unavailable while your church is in read-only mode.`;
  }
  if (request.action === "edit") {
    return `Editing ${resource} is currently unavailable while your church is in read-only mode.`;
  }
  if (request.action === "publish") {
    return `Publishing ${resource} is currently unavailable while your church is in read-only mode.`;
  }
  if (request.action === "delete") {
    return `Deleting ${resource} is currently unavailable while your church is in read-only mode.`;
  }
  return `${ACTION_VERBS[request.action]} ${resource} is currently unavailable while your church is in read-only mode.`;
}

export function isTrialAccessExpired(trial?: {
  access?: string | null;
  phase?: string | null;
} | null): boolean {
  return trial?.access === "expired" || trial?.phase === "expired";
}
