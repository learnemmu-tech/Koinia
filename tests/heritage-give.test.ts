import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = join(import.meta.dirname, "..");

test("Heritage Give page uses the campaign card listing with church-scoped routes", () => {
  const source = readFileSync(join(root, "src/templates/heritage/pages/give.tsx"), "utf8");
  const list = readFileSync(
    join(root, "src/components/donations/donations-list-client.tsx"),
    "utf8"
  );
  const card = readFileSync(
    join(root, "src/components/donations/donation-campaign-card.tsx"),
    "utf8"
  );
  assert.match(source, /listDonationCampaigns/);
  assert.match(source, /DonationsListClient/);
  assert.match(source, /clientSync=\{false\}/);
  assert.match(source, /hrefPrefix=\{churchWebsitePath\(model\.church\.slug, "\/give"\)\}/);
  assert.match(source, /Support active ministry campaigns/);
  assert.match(source, /DonationCampaignDetailClient/);
  assert.match(source, /listHref=\{churchWebsitePath\(model\.church\.slug, "\/give"\)\}/);
  assert.match(source, /clientSync=\{false\}/);
  assert.match(source, /heritage-content-system/);
  assert.doesNotMatch(source, /max-w-3xl/);
  assert.match(list, /searchPlaceholder/);
  assert.match(list, /allCampaigns/);
  assert.match(list, /activeTitle/);
  assert.match(list, /completedTitle/);
  assert.match(card, /View Campaign/);
  assert.match(card, /hrefPrefix/);
  assert.match(card, /contentItemHref/);

  const detail = readFileSync(
    join(root, "src/components/donations/donation-campaign-detail-client.tsx"),
    "utf8"
  );
  assert.match(detail, /DonateForm/);
  assert.match(detail, /listHref = "\/donations"/);
  assert.match(detail, /About This Campaign/);
  assert.match(detail, /Make a Donation/);
  assert.match(detail, /Suggested amount|DonateForm/);
});

test("Heritage videos listing includes a working search over title and description", () => {
  const page = readFileSync(join(root, "src/templates/heritage/pages/videos.tsx"), "utf8");
  const list = readFileSync(
    join(root, "src/templates/heritage/components/heritage-videos-list.tsx"),
    "utf8"
  );
  assert.match(page, /HeritageVideosList/);
  assert.match(list, /ContentListToolbar/);
  assert.match(list, /video\.title/);
  assert.match(list, /video\.description/);
  assert.match(list, /No videos match that search/);
});
