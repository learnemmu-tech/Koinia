import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { churchGroupsRedirectPath, churchWebsitePath } from "../src/lib/templates/paths";

const src = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", "src", file), "utf8");
const root = (file: string) =>
  readFileSync(join(import.meta.dirname, "..", file), "utf8");

test("church /groups aliases Ministries without loading church data", () => {
  assert.equal(
    churchGroupsRedirectPath("/c/church-of-the-holy/groups"),
    churchWebsitePath("church-of-the-holy", "/ministries")
  );
  assert.equal(
    churchGroupsRedirectPath("/c/Church-Of-The-Holy/groups/"),
    churchWebsitePath("church-of-the-holy", "/ministries")
  );
  assert.equal(churchGroupsRedirectPath("/c/church-of-the-holy/ministries"), null);
  assert.equal(churchGroupsRedirectPath("/groups"), null);
});

test("middleware and next.config issue an HTTP redirect for church groups", () => {
  const middleware = src("middleware.ts");
  assert.match(middleware, /churchGroupsRedirectPath/);
  assert.match(middleware, /NextResponse\.redirect/);
  const config = root("next.config.ts");
  assert.match(config, /source: "\/c\/:slug\/groups"/);
  assert.match(config, /destination: "\/c\/:slug\/ministries"/);
});

test("groups page redirects by slug and does not load the public church shell", () => {
  const page = src("app/(church-site)/c/[slug]/groups/page.tsx");
  assert.match(page, /redirect\(churchWebsitePath\(slug, "\/ministries"\)\)/);
  assert.doesNotMatch(page, /requireChurchWebsite|loadChurchWebsiteBySlug/);
});
