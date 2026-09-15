import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConfigLoadResult, ExternalPackExecutionPin, ExternalPackPolicy, ScanConfig, Severity } from "./types.js";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SHA256 = /^[A-Fa-f0-9]{64}$/;
const PACK_ID = /^[a-z0-9][a-z0-9._-]{1,127}$/;

const DEFAULT_EXTERNAL_PACKS: ExternalPackPolicy = {
  requireSigned: true,
  allow: [],
  trustedPublishers: [],
  trustedKeys: {},
  revokedPublishers: [],
  revokedKeys: [],
  execution: {
    enabled: false,
    trustedSourceRepositories: [],
    pins: {}
  }
};

export const DEFAULT_CONFIG: ScanConfig = {
  version: 1,
  exclude: [],
  maxFileSizeBytes: 10 * 1024 * 1024,
  largeFileThresholdBytes: 5 * 1024 * 1024,
  ci: { failOn: "critical" },
  packs: { disabled: [] },
  rules: { disabled: [] },
  externalPacks: DEFAULT_EXTERNAL_PACKS
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function validSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITIES.includes(value as Severity);
}

function normaliseExcludes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

function normaliseTrustedKeys(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("externalPacks.trustedKeys must be an object keyed by Ed25519 key ID.");
  const result: Record<string, string> = {};
  for (const [keyId, publicKey] of Object.entries(value as Record<string, unknown>)) {
    if (!/^ed25519:[A-Za-z0-9._:-]{3,127}$/.test(keyId)) throw new Error(`Invalid trusted Ed25519 key ID: ${keyId}.`);
    if (typeof publicKey !== "string" || publicKey.trim().length === 0) throw new Error(`Trusted public key for ${keyId} must be a non-empty PEM string.`);
    result[keyId] = publicKey;
  }
  return result;
}

function parseExecutionPins(value: unknown): Record<string, ExternalPackExecutionPin> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("externalPacks.execution.pins must be an object keyed by pack ID.");
  const result: Record<string, ExternalPackExecutionPin> = {};
  for (const [packId, rawPin] of Object.entries(value as Record<string, unknown>)) {
    if (!PACK_ID.test(packId)) throw new Error(`Invalid external pack execution pin ID: ${packId}.`);
    if (!rawPin || typeof rawPin !== "object" || Array.isArray(rawPin)) throw new Error(`Execution pin for ${packId} must be an object.`);
    const pin = rawPin as Record<string, unknown>;
    if (typeof pin.version !== "string" || !SEMVER.test(pin.version)) throw new Error(`Execution pin for ${packId} has an invalid version.`);
    if (typeof pin.sha256 !== "string" || !SHA256.test(pin.sha256)) throw new Error(`Execution pin for ${packId} has an invalid sha256 digest.`);
    result[packId] = { version: pin.version, sha256: pin.sha256.toLowerCase() };
  }
  return result;
}

function parseExternalPackPolicy(value: unknown): ExternalPackPolicy {
  if (value === undefined) return DEFAULT_EXTERNAL_PACKS;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("externalPacks must be a JSON object.");
  const raw = value as Record<string, unknown>;
  const requireSigned = raw.requireSigned ?? true;
  if (typeof requireSigned !== "boolean") throw new Error("externalPacks.requireSigned must be a boolean.");
  const allow = normaliseExcludes(raw.allow);
  const trustedPublishers = normaliseExcludes(raw.trustedPublishers);
  const trustedKeys = normaliseTrustedKeys(raw.trustedKeys);
  const revokedPublishers = normaliseExcludes(raw.revokedPublishers);
  const revokedKeys = normaliseExcludes(raw.revokedKeys);

  const executionRaw = raw.execution === undefined ? {} : raw.execution;
  if (!executionRaw || typeof executionRaw !== "object" || Array.isArray(executionRaw)) {
    throw new Error("externalPacks.execution must be a JSON object.");
  }
  const executionObject = executionRaw as Record<string, unknown>;
  const executionEnabled = executionObject.enabled ?? false;
  if (typeof executionEnabled !== "boolean") throw new Error("externalPacks.execution.enabled must be a boolean.");
  const trustedSourceRepositories = normaliseExcludes(executionObject.trustedSourceRepositories);
  const pins = parseExecutionPins(executionObject.pins);

  if (requireSigned && trustedPublishers.length > 0 && Object.keys(trustedKeys).length === 0) {
    throw new Error("externalPacks.trustedKeys is required when signed external packs are trusted.");
  }
  if (executionEnabled && !requireSigned) {
    throw new Error("externalPacks.execution.enabled requires externalPacks.requireSigned=true.");
  }
  if (executionEnabled && trustedSourceRepositories.length === 0) {
    throw new Error("externalPacks.execution.trustedSourceRepositories must contain at least one source when execution is enabled.");
  }
  if (executionEnabled && Object.keys(pins).length === 0) {
    throw new Error("externalPacks.execution.pins must contain at least one explicit version/digest pin when execution is enabled.");
  }

  return {
    requireSigned,
    allow,
    trustedPublishers,
    trustedKeys,
    revokedPublishers,
    revokedKeys,
    execution: {
      enabled: executionEnabled,
      trustedSourceRepositories,
      pins
    }
  };
}

function parseConfig(raw: unknown): ScanConfig {
  if (!raw || typeof raw !== "object") throw new Error("Configuration must be a JSON object.");
  const value = raw as Record<string, unknown>;
  if (value.version !== undefined && value.version !== 1) throw new Error("Unsupported .steward.json version. Expected version 1.");

  const maxFileSizeBytes = value.maxFileSizeBytes ?? DEFAULT_CONFIG.maxFileSizeBytes;
  const largeFileThresholdBytes = value.largeFileThresholdBytes ?? DEFAULT_CONFIG.largeFileThresholdBytes;
  if (!isPositiveInteger(maxFileSizeBytes)) throw new Error("maxFileSizeBytes must be a positive integer.");
  if (!isPositiveInteger(largeFileThresholdBytes)) throw new Error("largeFileThresholdBytes must be a positive integer.");
  if (largeFileThresholdBytes > maxFileSizeBytes) throw new Error("largeFileThresholdBytes cannot exceed maxFileSizeBytes.");

  const ci = value.ci && typeof value.ci === "object" ? value.ci as Record<string, unknown> : {};
  const failOn = ci.failOn ?? DEFAULT_CONFIG.ci.failOn;
  if (!validSeverity(failOn)) throw new Error(`ci.failOn must be one of: ${SEVERITIES.join(", ")}.`);

  const packs = value.packs && typeof value.packs === "object" ? value.packs as Record<string, unknown> : {};
  const rules = value.rules && typeof value.rules === "object" ? value.rules as Record<string, unknown> : {};

  return {
    version: 1,
    exclude: normaliseExcludes(value.exclude),
    maxFileSizeBytes,
    largeFileThresholdBytes,
    ci: { failOn },
    packs: { disabled: normaliseExcludes(packs.disabled) },
    rules: { disabled: normaliseExcludes(rules.disabled) },
    externalPacks: parseExternalPackPolicy(value.externalPacks)
  };
}

export async function loadConfig(root: string): Promise<ConfigLoadResult> {
  const path = join(root, ".steward.json");
  try {
    return { config: parseConfig(JSON.parse(await readFile(path, "utf8"))) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { config: DEFAULT_CONFIG };
    const message = error instanceof Error ? error.message : "Unable to read .steward.json.";
    return { config: DEFAULT_CONFIG, warning: message };
  }
}

export async function initConfig(root: string): Promise<boolean> {
  const path = join(root, ".steward.json");
  try {
    await access(path);
    return false;
  } catch {
    await writeFile(path, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf8");
    return true;
  }
}
