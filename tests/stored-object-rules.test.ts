import assert from "node:assert/strict";
import test from "node:test";

import {
  completionMayWrite,
  deletionMayStart,
  extensionForMime,
  publicFileAllowed,
  sniffObjectSignature,
} from "../src/lib/storage/stored-object-rules.ts";

test("completion writes only a pending upload", () => {
  assert.equal(completionMayWrite("pending"), true);
  assert.equal(completionMayWrite("deleting"), false);
  assert.equal(completionMayWrite("ready"), false);
  assert.equal(completionMayWrite("failed"), false);
});

test("deletion starts from pending, ready, or failed", () => {
  assert.equal(deletionMayStart("pending"), true);
  assert.equal(deletionMayStart("ready"), true);
  assert.equal(deletionMayStart("failed"), true);
  assert.equal(deletionMayStart("deleting"), false);
});

test("public delivery allows legacy files and published public objects only", () => {
  assert.equal(publicFileAllowed(null), true);
  assert.equal(
    publicFileAllowed({ status: "ready", visibility: "public_read", published: true }),
    true
  );
  assert.equal(
    publicFileAllowed({ status: "ready", visibility: "private", published: false }),
    false
  );
  assert.equal(
    publicFileAllowed({ status: "pending", visibility: "public_read", published: false }),
    false
  );
  assert.equal(
    publicFileAllowed({ status: "ready", visibility: "public_read", published: false }),
    false
  );
});
test("sniffed image signature matches the allowed mime", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const sniffed = sniffObjectSignature(png);
  assert.equal(sniffed?.mimeType, "image/png");
  assert.equal(sniffed?.purpose, "image");
  assert.equal(extensionForMime("image", "image/png"), "png");
  assert.equal(extensionForMime("image", "image/svg+xml"), null);
});
