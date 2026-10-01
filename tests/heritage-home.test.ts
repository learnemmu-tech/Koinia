import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { churchWebsitePath } from "../src/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "../src/lib/templates/types";
import {
  eventDateParts,
  formatChurchAddress,
  heritageChurchPhotograph,
  heritageCommunityCta,
  heritageDirectionsHref,
  resolveHeritageImage,
  upcomingChurchEvents,
} from "../src/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "../src/templates/heritage/theme";

function model(overrides: Partial<ChurchWebsiteViewModel["viewer"]> = {}) {
  return {
    church: {
      id: "11111111-1111-4111-8111-111111111111",
      organizationId: "org",
      name: "Test Church",
      slug: "grace-church",
      address: "1 Main St",
      city: "Jerusalem",
      state: "N/A",
      country: "Israel",
    },
    website: { visibility: {}, images: {}, socialLinks: {} },
    templateId: "heritage",
    events: [],
    viewer: { isAuthenticated: false, isMember: false, ...overrides },
  } as unknown as ChurchWebsiteViewModel;
}

test("prayer is open to everyone and stays on the church route", () => {
  for (const viewer of [{}, { isAuthenticated: true }, { isAuthenticated: true, isMember: true }]) {
    const cta = heritageCommunityCta(model(viewer), "prayer");
    assert.equal(cta.href, churchWebsitePath("grace-church", "/prayer"));
  }
});

test("visitors sign in on the church login and return to the same feature", () => {
  for (const [feature, path] of [
    ["chat", "/community"],
    ["shepherd", "/shepherd"],
  ] as const) {
    const cta = heritageCommunityCta(model(), feature);
    const target = churchWebsitePath("grace-church", path);
    assert.equal(
      cta.href,
      `${churchWebsitePath("grace-church", "/login")}?callbackUrl=${encodeURIComponent(target)}`
    );
  }
});

test("signed-in non-members are sent to join this church, members go straight in", () => {
  const signedIn = model({ isAuthenticated: true });
  assert.equal(heritageCommunityCta(signedIn, "chat").href, "/join/grace-church");
  assert.equal(heritageCommunityCta(signedIn, "shepherd").href, "/join/grace-church");

  const member = model({ isAuthenticated: true, isMember: true });
  assert.equal(
    heritageCommunityCta(member, "chat").href,
    churchWebsitePath("grace-church", "/community")
  );
  assert.equal(
    heritageCommunityCta(member, "shepherd").href,
    churchWebsitePath("grace-church", "/shepherd")
  );
});

test("address formatting skips placeholder parts", () => {
  assert.equal(formatChurchAddress(model()), "1 Main St, Jerusalem, Israel");
});

test("directions link is only produced for a real address", () => {
  assert.equal(heritageDirectionsHref("  "), null);
  assert.match(heritageDirectionsHref("1 Main St, Jerusalem") ?? "", /query=1%20Main%20St%2C%20Jerusalem$/);
});

test("upcoming events exclude past events and sort soonest first", () => {
  const now = new Date(2026, 8, 30, 12, 0).getTime();
  const event = (id: string, eventDate: string, eventTime = "") =>
    ({ id, eventDate, eventTime, title: id }) as ChurchWebsiteViewModel["events"][number];
  const result = upcomingChurchEvents(
    [
      event("past", "2026-09-01"),
      event("later", "2026-11-02"),
      event("soon", "2026-10-05"),
      event("earlier-today", "2026-09-30", "8:00 AM"),
    ],
    4,
    now
  );
  assert.deepEqual(result.map((item) => item.id), ["soon", "later"]);
  assert.deepEqual(upcomingChurchEvents([], 4, now), []);
});

test("event date parts are derived from the ISO date", () => {
  assert.deepEqual(eventDateParts("2026-10-05"), {
    month: "Oct",
    day: "5",
    weekday: "Monday",
  });
  assert.equal(eventDateParts("soon"), null);
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory()
      ? sourceFiles(full)
      : /\.(ts|tsx)$/.test(entry)
        ? [full]
        : [];
  });
}

test("homepage section order matches the approved screenshot", () => {
  const source = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "pages", "home.tsx"),
    "utf8"
  );
  const order = [
    "HeritageHero",
    "HeritageWorshipSermonSection",
    "HeritageCommunitySection",
    "HeritageEventsSection",
    "HeritageResourcesSection",
    "HeritageGivingSection",
  ].map((name) => source.indexOf(`<${name}`));
  assert.ok(order.every((index) => index >= 0));
  assert.doesNotMatch(source, /HeritageIntroductionSection/);
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order
  );
});

test("Heritage photographic fallbacks are real image files, not geometric SVGs", () => {
  assert.match(HERITAGE_FALLBACK_IMAGES.hero, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.about, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.giving, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.library, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.communityPrayer, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.communityChat, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.communityShepherd, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.sermon, /\.jpe?g$/);
  assert.match(HERITAGE_FALLBACK_IMAGES.featuredSermon, /\.jpe?g$/);
  assert.equal(
    heritageChurchPhotograph(model({}), undefined, HERITAGE_FALLBACK_IMAGES.about),
    HERITAGE_FALLBACK_IMAGES.about
  );
  const withHero = model({});
  withHero.website.images = { hero: "https://cdn.example/church-hero.jpg" };
  assert.equal(
    heritageChurchPhotograph(withHero, undefined, HERITAGE_FALLBACK_IMAGES.about),
    "https://cdn.example/church-hero.jpg"
  );
  assert.equal(
    resolveHeritageImage("https://cdn.example/saved-hero.jpg", HERITAGE_FALLBACK_IMAGES.hero),
    "https://cdn.example/saved-hero.jpg"
  );
  assert.equal(
    resolveHeritageImage(undefined, HERITAGE_FALLBACK_IMAGES.hero),
    HERITAGE_FALLBACK_IMAGES.hero
  );
});

test("Heritage homepage hero uses saved branding images with a photographic fallback", () => {
  const source = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "sections", "heritage-hero.tsx"),
    "utf8"
  );
  assert.match(source, /model\.website\.images\.hero/);
  assert.match(source, /HERITAGE_FALLBACK_IMAGES\.hero/);
  assert.match(source, /Plan Your Visit/);
  assert.match(source, /Watch Latest Sermon/);
  assert.match(source, /heritage-hero-media/);
  assert.match(source, /heritage-hero-copy/);
  assert.doesNotMatch(source, /heritage-hero-banner/);
  assert.doesNotMatch(source, /heritage-hero-scripture/);
  assert.doesNotMatch(source, /HERITAGE_FALLBACK_SCRIPTURE/);
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  assert.match(css, /\.heritage-hero \{[\s\S]*min-height:\s*100svh/);
  assert.match(css, /\.heritage-hero-media \{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.heritage-hero-media :is\(img\) \{[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.heritage-hero-copy \{[\s\S]*text-align:\s*left/);
  assert.doesNotMatch(css, /\.heritage-hero-banner/);
});

test("homepage does not show unimplemented ministry cards; Ministries page remains", () => {
  const home = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "pages", "home.tsx"),
    "utf8"
  );
  const pages = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "pages", "index.ts"),
    "utf8"
  );
  const about = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "pages", "about.tsx"),
    "utf8"
  );
  assert.doesNotMatch(home, /HeritageIntroductionSection/);
  assert.doesNotMatch(home, /MINISTRY_LAYOUT_FALLBACKS/);
  assert.doesNotMatch(home, /Explore All Ministries/);
  assert.match(pages, /HeritageMinistriesPage/);
  assert.match(about, /Who we are/);
});

test("featured sermon empty state keeps the approved overlay layout", () => {
  const source = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "sections",
      "heritage-featured-sermon.tsx"
    ),
    "utf8"
  );
  assert.match(source, /Featured Sermon/);
  assert.match(source, /SermonMediaSection/);
  assert.match(source, /coverImage/);
  assert.match(source, /Watch Now/);
  assert.match(source, /View Sermon Details/);
  assert.match(source, /heritage-sermon-play/);
  assert.match(source, /getYouTubeVideoId/);
  assert.match(source, /youtubeUrl/);
  assert.match(source, /audioUrl/);
  assert.doesNotMatch(source, /Sermons will appear here/);
});

test("Sunday Worship and Community are distinct bands with cohesive community cards", () => {
  const worship = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "sections",
      "heritage-worship-sermon.tsx"
    ),
    "utf8"
  );
  const community = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "sections",
      "heritage-community.tsx"
    ),
    "utf8"
  );
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  assert.match(worship, /heritage-worship-band/);
  assert.match(worship, /heritage-worship-heading/);
  assert.match(worship, /HeritageFeaturedSermon/);
  assert.match(worship, /sermons=\{sermons\}/);
  assert.match(community, /heritage-community-band/);
  assert.match(community, /heritage-community-cards/);
  assert.match(community, /heritage-community-lede/);
  assert.doesNotMatch(community, /heritage-leaf-panel/);
  assert.match(community, /Submit a Request/);
  assert.match(community, /Open Chat/);
  assert.match(community, /Chat with Shepherd AI/);
  assert.match(community, /heritage-community-card-icon/);
  assert.match(community, /<Heart /);
  assert.match(community, /<Users /);
  assert.match(community, /<BookOpen /);
  assert.match(css, /\.heritage-community-band \{[\s\S]*border-top/);
  assert.match(css, /\.heritage-sermon-feature \{/);
  assert.match(css, /aspect-ratio: 16 \/ 9/);
  assert.match(css, /\.heritage-community-card-icon \{[\s\S]*z-index:\s*1/);
  assert.match(css, /\.heritage-nav-dropdown \{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.heritage-nav-dropdown \{[\s\S]*left:\s*0/);
  assert.match(css, /\.heritage-nav-dropdown \{[\s\S]*width:\s*max-content/);
  assert.match(css, /a\.heritage-nav-dropdown-item \{[\s\S]*min-height:\s*1\.95rem/);
});

test("Heritage source never hardcodes localhost or a development host", () => {
  const root = join(import.meta.dirname, "..", "src", "templates", "heritage");
  const offenders = sourceFiles(root).filter((file) =>
    /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(readFileSync(file, "utf8"))
  );
  assert.deepEqual(offenders, []);
});

test("Heritage library banner keeps compact four-up resource cards and existing routes", () => {
  const source = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "sections",
      "heritage-resources.tsx"
    ),
    "utf8"
  );
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  assert.match(source, /HERITAGE_FALLBACK_IMAGES\.library/);
  assert.match(source, /path: "\/sermons"/);
  assert.match(source, /path: "\/songs"/);
  assert.match(source, /path: "\/articles"/);
  assert.match(source, /path: "\/videos"/);
  assert.match(source, /heritage-resources-cards/);
  assert.match(source, /View All Resources/);
  assert.doesNotMatch(source, /heritage-glass-tile/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,/);
});

test("Heritage typography uses Manrope headings and Inter body, not a display serif", () => {
  const fonts = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "fonts.ts"),
    "utf8"
  );
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  assert.match(fonts, /heritageDisplay = Manrope\(/);
  assert.match(fonts, /heritageSans = Inter\(/);
  assert.doesNotMatch(fonts, /Cormorant/);
  assert.doesNotMatch(css, /Times New Roman/);
  assert.match(css, /font-weight:\s*600/);
  assert.match(
    css,
    /\.heritage-display \{[\s\S]*ui-sans-serif/
  );
});

test("Heritage header keeps the logo and church name without the default subtitle", () => {
  const header = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "components", "heritage-header.tsx"),
    "utf8"
  );
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  const frame = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "components", "heritage-header-frame.tsx"),
    "utf8"
  );
  assert.match(header, /model\.church\.name/);
  assert.match(header, /model\.website\.images\.logo/);
  assert.match(header, /heritage-brand-name/);
  assert.match(header, /heritage-header-bar/);
  assert.doesNotMatch(header, /Faith · Community · Service/);
  assert.match(css, /\.heritage-header-bar \{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
  assert.match(css, /\.heritage-header-bar \{[\s\S]*overflow:\s*visible/);
  assert.match(css, /\.heritage-brand-name \{[\s\S]*font-family:\s*var\(--font-heritage-display\)/);
  assert.match(css, /\.heritage-brand-name \{[\s\S]*white-space:\s*nowrap/);
  assert.match(css, /@media \(max-width: 1279px\) \{[\s\S]*-webkit-line-clamp:\s*2/);
  assert.match(frame, /heritage-header-overlay/);
  const controls = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "src",
      "templates",
      "heritage",
      "components",
      "heritage-member-controls.tsx"
    ),
    "utf8"
  );
  assert.match(controls, /heritage-header-locale/);
  assert.match(controls, /heritage-header-bell/);
  assert.doesNotMatch(controls, /heritage-muted-bg/);
  assert.match(css, /\.heritage-header-locale \{[\s\S]*min-height:\s*2\.25rem/);
  assert.doesNotMatch(css, /\.heritage-header-locale:hover \{[\s\S]*heritage-muted-bg/);
});

test("member account menu keeps profile routes relative and omits extra shortcuts", () => {
  const menu = readFileSync(
    join(import.meta.dirname, "..", "src", "components", "app-sidebar", "account-menu-items.tsx"),
    "utf8"
  );
  assert.match(menu, /href="\/profile"/);
  assert.match(menu, /href="\/settings\/notifications"/);
  assert.match(menu, /href="\/settings\/appearance"/);
  assert.doesNotMatch(menu, /href="\/community"/);
  assert.doesNotMatch(menu, /href="\/shepherd"/);
  assert.doesNotMatch(menu, /href="\/prayer/);
  assert.doesNotMatch(menu, /href="\/settings"/);
  assert.doesNotMatch(menu, /href="\/about"/);
  assert.doesNotMatch(menu, /localhost/);
});

test("mobile homepage hero copy sits at the top and does not cover the speaker", () => {
  const css = readFileSync(
    join(import.meta.dirname, "..", "src", "templates", "heritage", "heritage.css"),
    "utf8"
  );
  const heroMobile = css.match(
    /\.heritage-hero \{\s*align-items: flex-start;[\s\S]*?\.heritage-hero-copy-wrap \{\s*align-items: flex-start;[\s\S]*?object-position: 38% 48%;/
  );
  assert.ok(heroMobile, "mobile hero copy must be top-aligned with a right-biased image");
  const heroEnd = css.match(
    /\.heritage-hero \{\s*align-items: flex-end;[\s\S]{0,120}\.heritage-hero-copy-wrap \{\s*align-items: flex-end;/
  );
  assert.equal(heroEnd, null);
});
