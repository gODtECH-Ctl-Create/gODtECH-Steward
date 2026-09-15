import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { evaluateExternalPack } from "../src/core/external-pack-governance.js";
import { manifestSigningBytes, parseRulePackManifest, type RulePackManifest } from "../src/core/trust.js";
import type { ExternalPackPolicy } from "../src/core/types.js";

const EMPTY_WASM = Uint8Array.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const PACK_ID = "example.security-hygiene";
const PUBLISHER = "example-org";
const KEY_ID = "ed25519:test-key-1";
const SOURCE = "https://github.com/example-org/security-hygiene";
const SOURCE_COMMIT = "0123456789abcdef0123456789abcdef01234567";

function policy(publicKey: string, digest: string, enabled = false): ExternalPackPolicy {
  return {
    requireSigned: true,
    allow: [PACK_ID],
    trustedPublishers: [PUBLISHER],
    trustedKeys: { [KEY_ID]: publicKey },
    revokedPublishers: [],
    revokedKeys: [],
    execution: {
      enabled,
      trustedSourceRepositories: enabled ? [SOURCE] : [],
      pins: enabled ? { [PACK_ID]: { version: "1.0.0", sha256: digest } } : {}
    }
  };
}

async function createSignedPack(root: string, includeProvenance = true): Promise<{
  manifestPath: string;
  artifactPath: string;
  publicKey: string;
  digest: string;
}> {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const artifactPath = join(root, "pack.wasm");
  await writeFile(artifactPath, EMPTY_WASM);
  const artifact = await readFile(artifactPath);
  const digest = createHash("sha256").update(artifact).digest("hex");

  const raw: Record<string, unknown> = {
    schemaVersion: 1,
    kind: "steward-rule-pack",
    id: PACK_ID,
    version: "1.0.0",
    publisher: { id: PUBLISHER, keyId: KEY_ID },
    compatibility: { ruleApi: 1, resultSchema: 1 },
    artifact: { format: "wasm", sha256: digest, sizeBytes: artifact.length, uri: "file:./pack.wasm" },
    capabilities: ["repository.read"],
    limits: { maxExecutionMs: 1000, maxMemoryMiB: 32, maxFindings: 100 },
    signature: { algorithm: "ed25519", value: "AA==" }
  };
  if (includeProvenance) {
    raw.provenance = { sourceRepository: SOURCE, sourceCommit: SOURCE_COMMIT, builder: "github-actions/example-org/security-hygiene" };
  }

  const manifest = parseRulePackManifest(raw);
  manifest.signature.value = sign(null, manifestSigningBytes(manifest), privateKey).toString("base64");
  const manifestPath = join(root, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return {
    manifestPath,
    artifactPath,
    publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    digest
  };
}

export async function run(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "steward-governance-"));
  const pack = await createSignedPack(root);

  const disabled = await evaluateExternalPack(pack.manifestPath, pack.artifactPath, policy(pack.publicKey, pack.digest, false));
  assert.equal(disabled.audit.verification.accepted, true);
  assert.equal(disabled.audit.admission.allowed, false);
  assert.equal(disabled.audit.admission.reasonCode, "execution_disabled");

  const admittedPolicy = policy(pack.publicKey, pack.digest, true);
  const admitted = await evaluateExternalPack(pack.manifestPath, pack.artifactPath, admittedPolicy);
  assert.equal(admitted.audit.verification.accepted, true);
  assert.equal(admitted.audit.verification.signatureVerified, true);
  assert.equal(admitted.audit.admission.allowed, true);
  assert.equal(admitted.audit.admission.reasonCode, "admitted");
  assert.equal(admitted.audit.provenance.sourceRepository, SOURCE);
  assert.equal(JSON.stringify(admitted.audit).includes("BEGIN PUBLIC KEY"), false);
  assert.equal(JSON.stringify(admitted.audit).includes(pack.artifactPath), false);

  const revokedPublisher = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, revokedPublishers: [PUBLISHER] }
  );
  assert.equal(revokedPublisher.audit.verification.accepted, false);
  assert.equal(revokedPublisher.audit.verification.reasonCode, "publisher_revoked");
  assert.equal(revokedPublisher.audit.admission.allowed, false);

  const revokedKey = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, revokedKeys: [KEY_ID] }
  );
  assert.equal(revokedKey.audit.verification.reasonCode, "key_revoked");

  const untrustedPublisher = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, trustedPublishers: ["other-org"] }
  );
  assert.equal(untrustedPublisher.audit.verification.reasonCode, "publisher_untrusted");

  const untrustedSource = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, execution: { ...admittedPolicy.execution, trustedSourceRepositories: ["https://github.com/other/repo"] } }
  );
  assert.equal(untrustedSource.audit.admission.reasonCode, "provenance_source_untrusted");

  const noPin = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, execution: { ...admittedPolicy.execution, pins: {} } }
  );
  assert.equal(noPin.audit.admission.reasonCode, "pin_missing");

  const wrongVersion = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, execution: { ...admittedPolicy.execution, pins: { [PACK_ID]: { version: "0.9.0", sha256: pack.digest } } } }
  );
  assert.equal(wrongVersion.audit.admission.reasonCode, "pin_version_mismatch");

  const wrongDigest = await evaluateExternalPack(
    pack.manifestPath,
    pack.artifactPath,
    { ...admittedPolicy, execution: { ...admittedPolicy.execution, pins: { [PACK_ID]: { version: "1.0.0", sha256: "0".repeat(64) } } } }
  );
  assert.equal(wrongDigest.audit.admission.reasonCode, "pin_digest_mismatch");

  const noProvenanceRoot = await mkdtemp(join(tmpdir(), "steward-governance-no-prov-"));
  const noProvenancePack = await createSignedPack(noProvenanceRoot, false);
  const noProvenance = await evaluateExternalPack(
    noProvenancePack.manifestPath,
    noProvenancePack.artifactPath,
    policy(noProvenancePack.publicKey, noProvenancePack.digest, true)
  );
  assert.equal(noProvenance.audit.verification.accepted, true);
  assert.equal(noProvenance.audit.admission.reasonCode, "provenance_missing");

  const incompatibleRaw = JSON.parse(await readFile(pack.manifestPath, "utf8")) as RulePackManifest;
  incompatibleRaw.compatibility.ruleApi = 2;
  await writeFile(pack.manifestPath, JSON.stringify(incompatibleRaw, null, 2) + "\n", "utf8");
  const incompatible = await evaluateExternalPack(pack.manifestPath, pack.artifactPath, admittedPolicy);
  assert.equal(incompatible.audit.verification.accepted, false);
  assert.equal(incompatible.audit.verification.reasonCode, "incompatible");
  assert.equal(incompatible.audit.admission.reasonCode, "verification_rejected");
}

await run();
