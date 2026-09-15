import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/core/config.js";

const PACK_ID = "example.security-hygiene";
const DIGEST = "a".repeat(64);

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "steward-external-config-"));
}

function enabledPolicy(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    requireSigned: true,
    allow: [PACK_ID],
    trustedPublishers: ["example-org"],
    trustedKeys: { "ed25519:test-key-1": "PUBLIC KEY PLACEHOLDER" },
    revokedPublishers: [],
    revokedKeys: [],
    execution: {
      enabled: true,
      trustedSourceRepositories: ["https://github.com/example-org/security-hygiene"],
      pins: {
        [PACK_ID]: { version: "1.0.0", sha256: DIGEST }
      }
    },
    ...overrides
  };
}

test("external execution policy defaults to disabled", async () => {
  const root = await fixture();
  const result = await loadConfig(root);
  assert.equal(result.warning, undefined);
  assert.equal(result.config.externalPacks.execution.enabled, false);
  assert.deepEqual(result.config.externalPacks.revokedPublishers, []);
  assert.deepEqual(result.config.externalPacks.revokedKeys, []);
  assert.deepEqual(result.config.externalPacks.execution.pins, {});
});

test("explicit signed execution policy with source and digest pin is accepted", async () => {
  const root = await fixture();
  await writeFile(join(root, ".steward.json"), JSON.stringify({ version: 1, externalPacks: enabledPolicy() }), "utf8");
  const result = await loadConfig(root);
  assert.equal(result.warning, undefined);
  assert.equal(result.config.externalPacks.execution.enabled, true);
  assert.equal(result.config.externalPacks.execution.pins[PACK_ID]?.version, "1.0.0");
  assert.equal(result.config.externalPacks.execution.pins[PACK_ID]?.sha256, DIGEST);
});

test("execution policy fails closed when signatures are disabled", async () => {
  const root = await fixture();
  await writeFile(
    join(root, ".steward.json"),
    JSON.stringify({ version: 1, externalPacks: enabledPolicy({ requireSigned: false }) }),
    "utf8"
  );
  const result = await loadConfig(root);
  assert.match(result.warning ?? "", /execution\.enabled requires externalPacks\.requireSigned=true/);
  assert.equal(result.config.externalPacks.execution.enabled, false);
});

test("execution policy fails closed without a trusted provenance source", async () => {
  const root = await fixture();
  const policy = enabledPolicy();
  policy.execution = {
    enabled: true,
    trustedSourceRepositories: [],
    pins: { [PACK_ID]: { version: "1.0.0", sha256: DIGEST } }
  };
  await writeFile(join(root, ".steward.json"), JSON.stringify({ version: 1, externalPacks: policy }), "utf8");
  const result = await loadConfig(root);
  assert.match(result.warning ?? "", /trustedSourceRepositories must contain at least one source/);
  assert.equal(result.config.externalPacks.execution.enabled, false);
});

test("execution policy fails closed without an exact version and digest pin", async () => {
  const root = await fixture();
  const policy = enabledPolicy();
  policy.execution = {
    enabled: true,
    trustedSourceRepositories: ["https://github.com/example-org/security-hygiene"],
    pins: {}
  };
  await writeFile(join(root, ".steward.json"), JSON.stringify({ version: 1, externalPacks: policy }), "utf8");
  const result = await loadConfig(root);
  assert.match(result.warning ?? "", /execution\.pins must contain at least one explicit version\/digest pin/);
  assert.equal(result.config.externalPacks.execution.enabled, false);
});

test("invalid execution pin digest fails closed", async () => {
  const root = await fixture();
  const policy = enabledPolicy();
  policy.execution = {
    enabled: true,
    trustedSourceRepositories: ["https://github.com/example-org/security-hygiene"],
    pins: { [PACK_ID]: { version: "1.0.0", sha256: "not-a-digest" } }
  };
  await writeFile(join(root, ".steward.json"), JSON.stringify({ version: 1, externalPacks: policy }), "utf8");
  const result = await loadConfig(root);
  assert.match(result.warning ?? "", /invalid sha256 digest/);
  assert.equal(result.config.externalPacks.execution.enabled, false);
});
