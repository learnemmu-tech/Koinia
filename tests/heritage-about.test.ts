import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  defaultAboutBeliefs,
  defaultAboutMission,
  parseAboutBeliefs,
  parseAboutValues,
  resolveAboutHeadline,
  resolveAboutIntro,
} from "../src/lib/templates/about-content";

test("About copy prefers saved admin fields over defaults", () => {
  assert.equal(resolveAboutHeadline("Our Story", "Church of the Holy"), "Our Story");
  assert.equal(
    resolveAboutHeadline("  ", "Church of the Holy"),
    "About Church of the Holy"
  );
  assert.equal(
    resolveAboutIntro("Saved intro", "Church description", "Welcome", "Church of the Holy"),
    "Saved intro"
  );
  assert.equal(
    resolveAboutIntro("", "Church description", "Welcome", "Church of the Holy"),
    "Church description"
  );
});

test("About values and beliefs drop empty rows and ignore invented extra fields", () => {
  assert.deepEqual(
    parseAboutValues([
      { title: " Worship ", body: " We gather. ", extra: true },
      { title: "", body: "" },
      "nope",
    ]),
    [{ title: "Worship", body: "We gather." }]
  );
  assert.equal(parseAboutBeliefs([]).length, 0);
  assert.match(defaultAboutMission("Church of the Holy"), /Church of the Holy/);
  assert.match(defaultAboutBeliefs("Church of the Holy")[0].body, /statement of faith/i);
});

test("Heritage About page uses admin fields, visit links, and does not invent leadership", () => {
  const source = readFileSync(
    join(import.meta.dirname, "../src/templates/heritage/pages/about.tsx"),
    "utf8"
  );
  assert.match(source, /aboutHeadline/);
  assert.match(source, /aboutIntro/);
  assert.match(source, /aboutMission/);
  assert.match(source, /aboutVision/);
  assert.match(source, /aboutValues/);
  assert.match(source, /aboutBeliefs/);
  assert.match(source, /aboutCommunity/);
  assert.match(source, /images\.about/);
  assert.match(source, /Plan Your Visit/);
  assert.match(source, /pastorName/);
  assert.doesNotMatch(source, /Steven Furtick/);
  assert.doesNotMatch(source, /Elevation/);
  assert.doesNotMatch(source, /EFCA/);
});
