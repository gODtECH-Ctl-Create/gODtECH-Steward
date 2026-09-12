import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConfigLoadResult, ExternalPackTrustPolicy, ScanConfig, Severity } from "./types.js";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

const DEFAULT_EXTERNAL_PACKS: ExternalPackTrustPolicy = {
  enabled: false,
  requireSigned: true,
  allow: [],
  trustedPublishers: {},
};

export const DEFAULT_CONFIG: ScanConfig = {
  version: 1,
  exclude: [],
  maxFileSizeBytes: 10 * 1024 * 1024,
  largeFileThresholdBytes: 5 * 1024 * 1024,
  ci: { failOn: "critical" },
  packs: { disabled: [] },
  rules: { disabled: [] },
  externalPacks: DEFAULT_EXTERNAL_PACKS,
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function validSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITIES.includes(value as Severity);
}

function normaliseExcludes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim()),
    ),
  ];
}

function parseTrustedPublishers(value: unknown): Record<string, Record<string, string>> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("externalPacks.trustedPublishers must be an object.");
  }
  const publishers: Record<string, Record<string, string>> = {};
  for (const [publisherId, keysValue] of Object.entries(value)) {
    if (!publisherId.trim()) throw new Error("externalPacks.trustedPublishers contains an empty publisher id.");
    if (!keysValue || typeof keysValue !== "object" || Array.isArray(keysValue)) {
      throw new Error(`externalPacks.trustedPublishers.${publisherId} must be an object of key ids to public keys.`);
    }
    const keys: Record<string, string> = {};
    for (const [keyId, publicKey] of Object.entries(keysValue)) {
      if (!keyId.trim() || typeof publicKey !== "string" || publicKey.trim().length === 0) {
        throw new Error(`externalPacks.trustedPublishers.${publisherId} contains an invalid key entry.`);
      }
      keys[keyId] = publicKey.trim();
    }
    publishers[publisherId] = keys;
  }
  return publishers;
}

function parseExternalPacks(value: unknown): ExternalPackTrustPolicy {
  if (value === undefined) return DEFAULT_EXTERNAL_PACKS;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("externalPacks must be a JSON object.");
  }
  const external = value as Record<string, unknown>;
  const enabled = external.enabled ?? DEFAULT_EXTERNAL_PACKS.enabled;
  const requireSigned = external.requireSigned ?? DEFAULT_EXTERNAL_PACKS.requireSigned;
  if (typeof enabled !== "boolean") throw new Error("externalPacks.enabled must be a boolean.");
  if (typeof requireSigned !== "boolean") throw new Error("externalPacks.requireSigned must be a boolean.");
  return {
    enabled,
    requireSigned,
    allow: normaliseExcludes(external.allow),
    trustedPublishers: parseTrustedPublishers(external.trustedPublishers),
  };
}

function parseConfig(raw: unknown): ScanConfig {
  if (!raw || typeof raw !== "object") throw new Error("Configuration must be a JSON object.");
  const value = raw as Record<string, unknown>;
  if (value.version !== undefined && value.version !== 1) {
    throw new Error("Unsupported .steward.json version. Expected version 1.");
  }

  const maxFileSizeBytes = value.maxFileSizeBytes ?? DEFAULT_CONFIG.maxFileSizeBytes;
  const largeFileThresholdBytes = value.largeFileThresholdBytes ?? DEFAULT_CONFIG.largeFileThresholdBytes;
  if (!isPositiveInteger(maxFileSizeBytes)) throw new Error("maxFileSizeBytes must be a positive integer.");
  if (!isPositiveInteger(largeFileThresholdBytes)) throw new Error("largeFileThresholdBytes must be a positive integer.");
  if (largeFileThresholdBytes > maxFileSizeBytes) {
    throw new Error("largeFileThresholdBytes cannot exceed maxFileSizeBytes.");
  }

  const ci = value.ci && typeof value.ci === "object" ? (value.ci as Record<string, unknown>) : {};
  const failOn = ci.failOn ?? DEFAULT_CONFIG.ci.failOn;
  if (!validSeverity(failOn)) throw new Error(`ci.failOn must be one of: ${SEVERITIES.join(", ")}.`);

  const packs = value.packs && typeof value.packs === "object" ? (value.packs as Record<string, unknown>) : {};
  const rules = value.rules && typeof value.rules === "object" ? (value.rules as Record<string, unknown>) : {};

  return {
    version: 1,
    exclude: normaliseExcludes(value.exclude),
    maxFileSizeBytes,
    largeFileThresholdBytes,
    ci: { failOn },
    packs: { disabled: normaliseExcludes(packs.disabled) },
    rules: { disabled: normaliseExcludes(rules.disabled) },
    externalPacks: parseExternalPacks(value.externalPacks),
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
