import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
const DEFAULT_CONFIG = { version: 1, exclude: [], maxFileSizeBytes: 2 * 1024 * 1024, largeFileThresholdBytes: 5 * 1024 * 1024, ci: { failOn: "critical" } };
export async function loadConfig(root) { try {
    const raw = JSON.parse(await readFile(join(root, ".steward.json"), "utf8"));
    return { ...DEFAULT_CONFIG, ...raw, exclude: Array.isArray(raw.exclude) ? raw.exclude : DEFAULT_CONFIG.exclude, ci: { ...DEFAULT_CONFIG.ci, ...(raw.ci ?? {}) } };
}
catch {
    return DEFAULT_CONFIG;
} }
export async function initConfig(root) { const path = join(root, ".steward.json"); try {
    await access(path);
    return false;
}
catch {
    await writeFile(path, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf8");
    return true;
} }
