import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickCurrentChurchId } from "../src/lib/organization/pick-current-church-id";
import { resolveEffectiveChurchId } from "../src/lib/organization/resolve-effective-church";

describe("pickCurrentChurchId", () => {
  it("prefers the profile church over a stale cookie and sibling churches", () => {
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "church-b",
        cookieChurchId: "church-a",
        accessibleChurchIds: ["church-a", "church-b", "church-c"],
      }),
      "church-b"
    );
  });

  it("does not use the first accessible church when the user just joined another", () => {
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "church-b",
        cookieChurchId: null,
        accessibleChurchIds: ["church-a", "church-b"],
      }),
      "church-b"
    );
  });

  it("uses a join-intent cookie when the profile pointer is still empty", () => {
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "",
        cookieChurchId: "church-b",
        accessibleChurchIds: ["church-a", "church-b"],
      }),
      "church-b"
    );
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "",
        cookieChurchId: "stale",
        accessibleChurchIds: ["church-a", "church-b"],
      }),
      ""
    );
  });

  it("uses the sole accessible church when profile and cookie are empty", () => {
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "",
        cookieChurchId: "",
        accessibleChurchIds: ["only-church"],
      }),
      "only-church"
    );
  });

  it("does not pick memberships[0] when multiple churches are accessible", () => {
    assert.equal(
      pickCurrentChurchId({
        profileChurchId: "",
        cookieChurchId: "",
        accessibleChurchIds: ["church-a", "church-b"],
      }),
      ""
    );
  });
});

describe("resolveEffectiveChurchId", () => {
  const churches = [
    { id: "church-a", isActive: true },
    { id: "church-b", isActive: true },
  ];

  it("uses the joined profile church instead of churches[0]", () => {
    assert.equal(
      resolveEffectiveChurchId({
        profile: { churchId: "church-b" },
        activeChurchId: "church-a",
        orgChurches: churches as never,
      }),
      "church-b"
    );
  });

  it("does not fall back to the first org church when the current church is unknown", () => {
    assert.equal(
      resolveEffectiveChurchId({
        profile: null,
        activeChurchId: "",
        orgChurches: churches as never,
        allowLegacyDefault: false,
      }),
      ""
    );
  });
});
