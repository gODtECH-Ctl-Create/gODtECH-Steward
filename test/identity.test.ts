import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowStewardIdentity, stewardIdentityBanner } from "../src/identity.js";

test("Steward identity uses the canonical shared product profile", () => {
  const banner = stewardIdentityBanner(80);
  assert.match(banner, /[█▀▄]/u);
  assert.ok(banner.includes("Deterministic software and repository housekeeping"));
  assert.ok(banner.split("\n\n", 1)[0]!.split("\n").every((line) => line.length <= 80));
});

test("Steward identity supports ASCII-only terminals", () => {
  const banner = stewardIdentityBanner(80, false);
  assert.ok(banner.includes("#"));
  assert.doesNotMatch(banner, /[█▀▄]/u);
});

test("Steward identity appears only for interactive human-readable output", () => {
  assert.equal(shouldShowStewardIdentity(["scan"], { isTTY: true }), true);
  assert.equal(shouldShowStewardIdentity(["--help"], { isTTY: true }), true);
  assert.equal(shouldShowStewardIdentity(["scan", "--json"], { isTTY: true }), false);
  assert.equal(shouldShowStewardIdentity(["scan", "--ci"], { isTTY: true }), false);
  assert.equal(shouldShowStewardIdentity(["forge-evidence"], { isTTY: true }), false);
  assert.equal(shouldShowStewardIdentity(["--version"], { isTTY: true }), false);
  assert.equal(shouldShowStewardIdentity(["scan"], { isTTY: false }), false);
  assert.equal(shouldShowStewardIdentity(["scan"], { isTTY: true, noBanner: "1" }), false);
});
