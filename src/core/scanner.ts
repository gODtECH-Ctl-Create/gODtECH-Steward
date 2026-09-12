import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { collectFiles } from "./files.js";
import { loadConfig } from "./config.js";
import { isGitRepository, trackedFiles } from "./git.js";
import { hygieneFindings } from "../rules/hygiene.js";
import { repositoryFindings } from "../rules/repository.js";
import { securityFindings } from "../rules/security.js";
import { documentationFindings } from "../rules/documentation.js";
import { scoreFindings } from "./score.js";
import type { ScanResult } from "./types.js";

export async function scanRepository(inputRoot: string): Promise<ScanResult> {
  const start = performance.now();
  const root = resolve(inputRoot);
  const config = await loadConfig(root);
  const files = await collectFiles(root, config);
  const tracked = isGitRepository(root) ? trackedFiles(root) : new Set<string>();
  const findings = [
    ...repositoryFindings(files, config),
    ...securityFindings(files, tracked),
    ...documentationFindings(root, files),
    ...hygieneFindings(files)
  ].sort((a, b) => (a.path ?? "").localeCompare(b.path ?? "") || a.id.localeCompare(b.id));

  return {
    version: 1,
    root,
    scannedFiles: files.length,
    textFiles: files.filter((file) => file.isText).length,
    findings,
    healthScore: scoreFindings(findings),
    durationMs: Math.round(performance.now() - start)
  };
}
