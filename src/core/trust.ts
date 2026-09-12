import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { ExternalPackPolicy } from "./types.js";

export const STEWARD_MANIFEST_SCHEMA_VERSION = 1 as const;
export const STEWARD_RULE_API_VERSION = 1 as const;
export const STEWARD_RESULT_SCHEMA_VERSION = 1 as const;

export interface RulePackManifest {
  $schema?: string;
  schemaVersion: number;
  kind: "steward-rule-pack";
  id: string;
  version: string;
  publisher: {
    id: string;
    keyId: string;
  };
  compatibility: {
    ruleApi: number;
    resultSchema: number;
  };
  artifact: {
    format: "wasm";
    sha256: string;
    sizeBytes: number;
    uri: string;
  };
  capabilities: string[];
  limits: {
    maxExecutionMs: number;
    maxMemoryMiB: number;
    maxFindings: number;
  };
  signature: {
    algorithm: "ed25519";
    value: string;
  };
}

export interface VerifiedRulePack {
  manifest: RulePackManifest;
  artifactPath: string;
  artifactSha256: string;
  sizeBytes: number;
  signatureVerified: boolean;
  sandboxEligible: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertManifest(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid rule-pack manifest: ${message}`);
}

export function parseRulePackManifest(raw: unknown): RulePackManifest {
  assertManifest(isRecord(raw), "expected a JSON object");
  assertManifest(raw.schemaVersion === STEWARD_MANIFEST_SCHEMA_VERSION, "unsupported schemaVersion");
  assertManifest(raw.kind === "steward-rule-pack", "kind must be steward-rule-pack");
  assertManifest(typeof raw.id === "string" && /^[a-z0-9][a-z0-9._-]{1,127}$/.test(raw.id), "invalid id");
  assertManifest(typeof raw.version === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(raw.version), "invalid version");

  assertManifest(isRecord(raw.publisher), "publisher must be an object");
  const publisher = raw.publisher;
  assertManifest(typeof publisher.id === "string" && /^[a-z0-9][a-z0-9._-]{1,63}$/.test(publisher.id), "invalid publisher.id");
  assertManifest(typeof publisher.keyId === "string" && /^ed25519:[A-Za-z0-9._:-]{3,127}$/.test(publisher.keyId), "invalid publisher.keyId");

  assertManifest(isRecord(raw.compatibility), "compatibility must be an object");
  const compatibility = raw.compatibility;
  assertManifest(compatibility.ruleApi === STEWARD_RULE_API_VERSION, "unsupported compatibility.ruleApi");
  assertManifest(compatibility.resultSchema === STEWARD_RESULT_SCHEMA_VERSION, "unsupported compatibility.resultSchema");

  assertManifest(isRecord(raw.artifact), "artifact must be an object");
  const artifact = raw.artifact;
  assertManifest(artifact.format === "wasm", "artifact.format must be wasm");
  assertManifest(typeof artifact.sha256 === "string" && /^[A-Fa-f0-9]{64}$/.test(artifact.sha256), "invalid artifact.sha256");
  assertManifest(typeof artifact.sizeBytes === "number" && Number.isSafeInteger(artifact.sizeBytes) && artifact.sizeBytes > 0 && artifact.sizeBytes <= 100 * 1024 * 1024, "invalid artifact.sizeBytes");
  assertManifest(typeof artifact.uri === "string" && artifact.uri.length > 0 && artifact.uri.length <= 2048, "invalid artifact.uri");

  assertManifest(Array.isArray(raw.capabilities) && raw.capabilities.length >= 1 && raw.capabilities.every((value) => value === "repository.read"), "capabilities must contain only repository.read");

  assertManifest(isRecord(raw.limits), "limits must be an object");
  const limits = raw.limits;
  assertManifest(Number.isSafeInteger(limits.maxExecutionMs) && limits.maxExecutionMs >= 1 && limits.maxExecutionMs <= 10_000, "invalid limits.maxExecutionMs");
  assertManifest(Number.isSafeInteger(limits.maxMemoryMiB) && limits.maxMemoryMiB >= 8 && limits.maxMemoryMiB <= 256, "invalid limits.maxMemoryMiB");
  assertManifest(Number.isSafeInteger(limits.maxFindings) && limits.maxFindings >= 1 && limits.maxFindings <= 5_000, "invalid limits.maxFindings");

  assertManifest(isRecord(raw.signature), "signature must be an object");
  const signature = raw.signature;
  assertManifest(signature.algorithm === "ed25519", "signature.algorithm must be ed25519");
  assertManifest(typeof signature.value === "string" && /^[A-Za-z0-9+/]+={0,2}$/.test(signature.value), "signature.value must be base64");

  return raw as unknown as RulePackManifest;
}

function canonicalise(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalise(entry)).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  const entries = Object.entries(value)
    .filter(([key]) => key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalise(entry)}`).join(",")}}`;
}

export function manifestSigningBytes(manifest: RulePackManifest): Buffer {
  return Buffer.from(canonicalise(manifest), "utf8");
}

function verifyManifestSignature(manifest: RulePackManifest, publicKeyPem: string): boolean {
  const publicKey = createPublicKey(publicKeyPem);
  const signature = Buffer.from(manifest.signature.value, "base64");
  return verifySignature(null, manifestSigningBytes(manifest), publicKey, signature);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function verifyRulePack(manifestPath: string, artifactPath: string, policy: ExternalPackPolicy): Promise<VerifiedRulePack> {
  const absoluteManifest = resolve(manifestPath);
  const absoluteArtifact = resolve(artifactPath);
  const manifest = parseRulePackManifest(JSON.parse(await readFile(absoluteManifest, "utf8")) as unknown);

  if (!policy.allow.includes(manifest.id)) throw new Error(`External rule pack is not allowed by policy: ${manifest.id}`);
  if (!policy.trustedPublishers.includes(manifest.publisher.id)) throw new Error(`External rule-pack publisher is not trusted: ${manifest.publisher.id}`);

  const artifact = await readFile(absoluteArtifact);
  const metadata = await stat(absoluteArtifact);
  if (metadata.size !== manifest.artifact.sizeBytes) {
    throw new Error(`Artifact size mismatch: manifest=${manifest.artifact.sizeBytes}, actual=${metadata.size}.`);
  }

  const digest = sha256(artifact);
  if (digest.toLowerCase() !== manifest.artifact.sha256.toLowerCase()) {
    throw new Error(`Artifact SHA-256 mismatch: manifest=${manifest.artifact.sha256}, actual=${digest}.`);
  }
  if (!WebAssembly.validate(Uint8Array.from(artifact))) throw new Error("Rule-pack artifact is not a valid WebAssembly (WASM) module.");

  let signatureVerified = false;
  if (policy.requireSigned) {
    const key = policy.trustedKeys[manifest.publisher.keyId];
    if (!key) throw new Error(`No trusted Ed25519 key configured for ${manifest.publisher.keyId}.`);
    signatureVerified = verifyManifestSignature(manifest, key);
    if (!signatureVerified) throw new Error("External rule-pack signature verification failed.");
  }

  return {
    manifest,
    artifactPath: absoluteArtifact,
    artifactSha256: digest,
    sizeBytes: metadata.size,
    signatureVerified,
    sandboxEligible: false
  };
}
