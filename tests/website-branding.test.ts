import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = join(import.meta.dirname, "..");

test("public Heritage surfaces read saved Branding & Media image slots", () => {
  const hero = readFileSync(
    join(root, "src/templates/heritage/sections/heritage-hero.tsx"),
    "utf8"
  );
  const worship = readFileSync(
    join(root, "src/templates/heritage/sections/heritage-featured-sermon.tsx"),
    "utf8"
  );
  const header = readFileSync(
    join(root, "src/templates/heritage/components/heritage-header.tsx"),
    "utf8"
  );
  const footer = readFileSync(
    join(root, "src/templates/heritage/components/heritage-footer.tsx"),
    "utf8"
  );
  const about = readFileSync(
    join(root, "src/templates/heritage/pages/about.tsx"),
    "utf8"
  );
  const ministries = readFileSync(
    join(root, "src/templates/heritage/pages/ministries.tsx"),
    "utf8"
  );
  const layout = readFileSync(
    join(root, "src/app/(church-site)/c/[slug]/layout.tsx"),
    "utf8"
  );

  assert.match(hero, /model\.website\.images\.hero/);
  assert.match(worship, /coverImage \|\| model\.website\.images\.worship/);
  assert.match(about, /aboutIntro/);
  assert.match(about, /aboutMission/);
  assert.match(about, /aboutValues/);
  assert.match(about, /aboutBeliefs/);
  assert.match(header, /model\.website\.images\.logo/);
  assert.match(footer, /model\.website\.images\.logo/);
  assert.match(about, /model\.website\.images\.about/);
  assert.match(ministries, /model\.website\.images\.featuredMinistry/);
  assert.match(layout, /images\.favicon/);
  assert.match(layout, /force-dynamic/);
});

test("website settings persist branding URLs and revalidate only that church site", () => {
  const persistence = readFileSync(
    join(root, "src/lib/postgres/church-websites.ts"),
    "utf8"
  );
  const route = readFileSync(
    join(root, "src/app/api/churches/[churchId]/website/route.ts"),
    "utf8"
  );
  const admin = readFileSync(
    join(root, "src/components/admin/pages/admin-website-page.tsx"),
    "utf8"
  );

  assert.match(persistence, /noStore/);
  assert.match(persistence, /heroImageUrl/);
  assert.match(persistence, /logoUrl/);
  assert.match(persistence, /worshipImageUrl/);
  assert.match(route, /revalidateChurchPublicSite/);
  assert.match(route, /churchWebsitePath\(church\.slug\)/);
  const revalidate = readFileSync(
    join(root, "src/lib/templates/revalidate-church-website.ts"),
    "utf8"
  );
  assert.match(revalidate, /\/give/);
  assert.match(revalidate, /\/about/);
  assert.match(revalidate, /revalidateTag\("donations"\)/);
  assert.match(admin, /kind: "church-website"/);
  assert.match(admin, /heroImageUrl/);
  assert.match(admin, /logoUrl/);
  assert.match(admin, /toast\.success\("Website settings saved"\)/);
  assert.match(persistence, /aboutCommunity/);
  assert.match(persistence, /aboutValues/);
  assert.match(route, /aboutValues/);
  assert.match(admin, /aboutIntro/);
  assert.match(admin, /About page/);
  assert.match(admin, /aboutValues/);
});
