import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { ScanConfig } from "./types.js";

const DEFAULT_CONFIG: ScanConfig = {
  version: 1,
  exclude: [],
  maxFileSizeBytes: 2 * 1024 * 1024,
  largeFileThresholdBytes: 5 * 1024 * 1024,
  ci: { failOn: "critical" }
};

export async function loadConfig(root: string): Promise<ScanConfig> {
  const path = join(root, ".steward.json");
  try {
    const raw = JSON.parse(await readFile(path, "utf8")) as Partial<ScanConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      exclude: Array.isArray(raw.exclude) ? raw.exclude : DEFAULT_CONFIG.exclude,
      ci: { ...DEFAULT_CONFIG.ci, ...(raw.ci ?? {}) }
    };
  } catch {
    return DEFAULT_CONFIG;
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
