import assert from "node:assert/strict";
import { test } from "node:test";

import { churchWebsitePath, churchCanonicalPath } from "../src/lib/templates/paths";
import {
  getHeritageFooterNavLinks,
  getHeritagePrimaryNavLinks,
  getHeritagePublicNavGroups,
  getHeritageUtilityLinks,
} from "../src/templates/heritage/public-nav";
import type { ChurchWebsiteViewModel } from "../src/lib/templates/types";

function model(slug: string): ChurchWebsiteViewModel {
  return {
    church: { id: "11111111-1111-4111-8111-111111111111", organizationId: "org", name: "Test Church", slug },
    website: {
      churchId: "11111111-1111-4111-8111-111111111111",
      organizationId: "org",
      activeTemplate: "heritage",
      siteTitle: "Test",
      metaDescription: "",
      indexable: true,
      socialLinks: {},
      visibility: {
        about: true,
        sermons: true,
        events: true,
        ministries: true,
        articles: true,
        videos: true,
        giving: true,
        contact: true,
      },
      images: {},
    },
    templateId: "heritage",
    sermons: [],
    events: [],
    articles: [],
    videos: [],
    campaigns: [],
    ministries: [],
    viewer: { isAuthenticated: false, isMember: false },
    isDemo: true,
  } as unknown as ChurchWebsiteViewModel;
}

test("header primary links match the approved homepage order", () => {
  const links = getHeritagePrimaryNavLinks(model("grace-church"));
  assert.deepEqual(
    links.map((item) => item.label),
    ["Home", "About", "Sermons", "Give", "Contact"]
  );
  assert.deepEqual(
    links.map((item) => item.href),
    [
      churchWebsitePath("grace-church"),
      churchWebsitePath("grace-church", "/about"),
      churchWebsitePath("grace-church", "/sermons"),
      churchWebsitePath("grace-church", "/give"),
      churchWebsitePath("grace-church", "/contact"),
    ]
  );
});

test("Resources keeps the remaining church-scoped features", () => {
  const groups = getHeritagePublicNavGroups(model("grace-church"));
  const resources = groups.find((group) => group.id === "resources");
  assert.ok(resources);
  assert.deepEqual(
    resources.items.map((item) => item.label),
    [
      "Songs",
      "Articles",
      "Videos",
      "Books",
      "Events",
      "Prayer",
      "Community",
      "Shepherd AI",
    ]
  );
  assert.equal(
    resources.items.find((item) => item.label === "Shepherd AI")?.href,
    churchWebsitePath("grace-church", "/shepherd")
  );
});

test("authenticated members keep Chat, Prayer Requests and Shepherd AI on church-scoped routes", () => {
  const memberModel = model("grace-church");
  memberModel.viewer = { isAuthenticated: true, isMember: true };
  const resources = getHeritagePublicNavGroups(memberModel).find((group) => group.id === "resources");
  assert.ok(resources);
  assert.equal(resources.items.find((item) => item.label === "Chat")?.href, churchWebsitePath("grace-church", "/community"));
  assert.equal(resources.items.find((item) => item.label === "Shepherd AI")?.href, churchWebsitePath("grace-church", "/shepherd"));
  assert.equal(
    resources.items.find((item) => item.label === "Prayer Requests")?.href,
    churchWebsitePath("grace-church", "/prayer")
  );
});

test("links to sections the church has hidden are not shown", () => {
  const hidden = model("grace-church");
  hidden.website.visibility = {
    ...hidden.website.visibility,
    about: false,
    sermons: false,
    events: false,
    ministries: false,
    articles: false,
    videos: false,
    giving: false,
    contact: false,
  };
  const labels = [
    ...getHeritagePrimaryNavLinks(hidden).map((item) => item.label),
    ...getHeritagePublicNavGroups(hidden).flatMap((group) => group.items.map((item) => item.label)),
  ];
  for (const label of ["About", "Sermons", "Events", "Articles", "Videos", "Give", "Contact"]) {
    assert.ok(!labels.includes(label), `${label} should be hidden`);
  }
  for (const label of ["Home", "Songs", "Books", "Prayer", "Community", "Shepherd AI"]) {
    assert.ok(labels.includes(label), `${label} should stay`);
  }
  assert.deepEqual(getHeritageUtilityLinks(hidden), []);
});

test("every navigation href stays inside the church website and never embeds a host", () => {
  const slug = "church-of-the-holy";
  const links = [
    ...getHeritagePrimaryNavLinks(model(slug)),
    ...getHeritagePublicNavGroups(model(slug)).flatMap((group) => group.items),
    ...getHeritageFooterNavLinks(model(slug)),
    ...getHeritageUtilityLinks(model(slug)),
  ];
  assert.ok(links.length > 10);
  for (const link of links) {
    assert.ok(
      link.href === `/c/${slug}` || link.href.startsWith(`/c/${slug}/`),
      `${link.label} -> ${link.href}`
    );
    assert.ok(!/localhost|127\.0\.0\.1|https?:/i.test(link.href), link.href);
  }
});

test("Give is a primary header link to the existing donation page", () => {
  const give = getHeritagePrimaryNavLinks(model("church-of-the-holy")).find(
    (item) => item.label === "Give"
  );
  assert.equal(give?.href, churchWebsitePath("church-of-the-holy", "/give"));
  const resources = getHeritagePublicNavGroups(model("church-of-the-holy"))[0];
  assert.ok(!resources?.items.some((item) => item.label === "Give"));
  assert.ok(!getHeritagePrimaryNavLinks(model("church-of-the-holy")).some((item) => item.label === "Ministries"));
});

test("church canonical paths never keep a localhost origin", () => {
  assert.equal(
    churchCanonicalPath("church-of-the-holy"),
    churchWebsitePath("church-of-the-holy")
  );
  assert.equal(
    churchCanonicalPath(
      "church-of-the-holy",
      "http://localhost:3000/c/church-of-the-holy"
    ),
    churchWebsitePath("church-of-the-holy")
  );
  assert.equal(
    churchCanonicalPath("grace-church", "https://example.com/c/grace-church"),
    "https://example.com/c/grace-church"
  );
});

