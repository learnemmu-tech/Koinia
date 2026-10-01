export type AboutCopyItem = {
  title: string;
  body: string;
};

const TITLE_MAX = 80;
const BODY_MAX = 2000;
const VALUES_MAX = 8;
const BELIEFS_MAX = 20;

function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/** Parses admin-managed About list items and drops empty rows. */
export function parseAboutCopyItems(
  value: unknown,
  limit: number
): AboutCopyItem[] {
  if (!Array.isArray(value)) return [];
  const items: AboutCopyItem[] = [];
  for (const entry of value) {
    if (items.length >= limit) break;
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { title?: unknown; body?: unknown };
    const title = clip(record.title, TITLE_MAX);
    const body = clip(record.body, BODY_MAX);
    if (!title && !body) continue;
    items.push({ title: title || "Untitled", body });
  }
  return items;
}

export function parseAboutValues(value: unknown): AboutCopyItem[] {
  return parseAboutCopyItems(value, VALUES_MAX);
}

export function parseAboutBeliefs(value: unknown): AboutCopyItem[] {
  return parseAboutCopyItems(value, BELIEFS_MAX);
}

export function defaultAboutIntro(churchName: string): string {
  return `${churchName} is a welcoming church community. We gather for worship, teaching, and fellowship, and everyone is invited.`;
}

export function defaultAboutMission(churchName: string): string {
  return `${churchName} exists to gather people for worship, grow together in faith, and share the love of Christ in our community.`;
}

export function defaultAboutCommunity(churchName: string): string {
  return `Life at ${churchName} is about worshiping together and walking with one another. Join us on Sunday, or connect through prayer, conversation, and the resources we share through the week.`;
}

export function defaultAboutValues(): AboutCopyItem[] {
  return [
    {
      title: "Worship",
      body: "We gather to worship God with gratitude, music, and prayer.",
    },
    {
      title: "Scripture",
      body: "We look to the Bible to shape our faith, teaching, and daily life.",
    },
    {
      title: "Community",
      body: "We welcome people to belong, grow, and walk with one another.",
    },
    {
      title: "Welcome",
      body: "Everyone is invited. Come as you are and take the next step at your own pace.",
    },
  ];
}

export function defaultAboutBeliefs(churchName: string): AboutCopyItem[] {
  return [
    {
      title: "Christ-centered and Scripture-rooted",
      body: `${churchName} is a Christ-centered church. Our teaching is rooted in Scripture. Add your church's statement of faith here so visitors can learn what you believe.`,
    },
  ];
}

export function resolveAboutHeadline(
  saved: string | undefined,
  churchName: string
): string {
  return saved?.trim() || `About ${churchName}`;
}

export function resolveAboutIntro(
  saved: string | undefined,
  churchDescription: string | undefined,
  welcomeMessage: string | undefined,
  churchName: string
): string {
  return (
    saved?.trim() ||
    churchDescription?.trim() ||
    welcomeMessage?.trim() ||
    defaultAboutIntro(churchName)
  );
}
