import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { manifestSigningBytes, parseRulePackManifest, verifyRulePack } from "../src/core/trust.js";
import { probeWasmSandbox } from "../src/core/wasm-sandbox.js";
import type { ExternalPackPolicy } from "../src/core/types.js";

const EMPTY_WASM = Uint8Array.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const IMPORTING_WASM = Uint8Array.from([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
  0x02, 0x07, 0x01, 0x01, 0x6d, 0x01, 0x66, 0x00, 0x00
]);

function basePolicy(publicKey: string): ExternalPackPolicy {
  return {
    requireSigned: true,
    allow: ["example.security-hygiene"],
    trustedPublishers: ["example-org"],
    trustedKeys: { "ed25519:test-key-1": publicKey }
  };
}

async function createSignedPack(root: string): Promise<{ manifestPath: string; artifactPath: string; policy: ExternalPackPolicy }> {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const artifactPath = join(root, "pack.wasm");
  await writeFile(artifactPath, EMPTY_WASM);
  const artifact = await readFile(artifactPath);
  const manifest = parseRulePackManifest({
    schemaVersion: 1,
    kind: "steward-rule-pack",
    id: "example.security-hygiene",
    version: "1.0.0",
    publisher: { id: "example-org", keyId: "ed25519:test-key-1" },
    compatibility: { ruleApi: 1, resultSchema: 1 },
    artifact: {
      format: "wasm",
      sha256: (await import("node:crypto")).createHash("sha256").update(artifact).digest("hex"),
      sizeBytes: artifact.length,
      uri: "file:./pack.wasm"
    },
    capabilities: ["repository.read"],
    limits: { maxExecutionMs: 1000, maxMemoryMiB: 32, maxFindings: 100 },
    signature: { algorithm: "ed25519", value: "AA==" }
  });
  manifest.signature.value = sign(null, manifestSigningBytes(manifest), privateKey).toString("base64");
  const manifestPath = join(root, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return { manifestPath, artifactPath, policy: basePolicy(publicKey.export({ type: "spki", format: "pem" }).toString()) };
}

export async function run(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "steward-trust-"));
  const { manifestPath, artifactPath, policy } = await createSignedPack(root);

  const verified = await verifyRulePack(manifestPath, artifactPath, policy);
  assert.equal(verified.signatureVerified, true);
  assert.equal(verified.sizeBytes, EMPTY_WASM.length);
  assert.equal(verified.sandboxEligible, false);

  await writeFile(artifactPath, Uint8Array.from([...EMPTY_WASM, 0x00]));
  await assert.rejects(() => verifyRulePack(manifestPath, artifactPath, policy), /size mismatch/);

  await assert.rejects(
    () => verifyRulePack(manifestPath, join(root, "missing.wasm"), policy),
    /ENOENT|no such file/i
  );

  await writeFile(artifactPath, EMPTY_WASM);
  const untrusted = { ...policy, trustedPublishers: ["other-org"] };
  await assert.rejects(() => verifyRulePack(manifestPath, artifactPath, untrusted), /publisher is not trusted/);

  const sandbox = await probeWasmSandbox(EMPTY_WASM, { maxExecutionMs: 1000, maxMemoryMiB: 32 });
  assert.equal(sandbox.eligible, true);
  assert.equal(sandbox.executed, true);

  const importedSandbox = await probeWasmSandbox(IMPORTING_WASM, { maxExecutionMs: 1000, maxMemoryMiB: 32 });
  assert.equal(importedSandbox.eligible, false);
  assert.deepEqual(importedSandbox.imports, ["m.f"]);
}
