import { performance } from "node:perf_hooks";
import { relative, resolve } from "node:path";
import { collectFiles, normalisePath } from "./files.js";
import { loadConfig } from "./config.js";
import { gitFacts } from "./git.js";
import { enabledRules } from "./rules.js";
import { scoreFindings } from "./score.js";
import type { Category, Finding, ScanContext, ScanResult } from "./types.js";

const SEVERITY_ORDER = new Map([["critical", 0], ["high", 1], ["medium", 2], ["low", 3], ["info", 4]]);

function categoryCounts(findings: readonly Finding[]): Partial<Record<Category, number>> {
  return findings.reduce<Partial<Record<Category, number>>>((counts, finding) => {
    counts[finding.category] = (counts[finding.category] ?? 0) + 1;
    return counts;
  }, {});
}

function ruleCounts(findings: readonly Finding[]): Record<string, number> {
  return findings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.rule] = (counts[finding.rule] ?? 0) + 1;
    return counts;
  }, {});
}

function scopedTrackedFiles(root: string, gitRoot: string | undefined, tracked: ReadonlySet<string>): Set<string> {
  if (!gitRoot || resolve(root) === resolve(gitRoot)) return new Set(tracked);
  const scoped = new Set<string>();
  for (const path of tracked) {
    const absolute = resolve(gitRoot, path);
    const relativePath = relative(root, absolute);
    if (relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${require("node:path").sep}`))) {
      scoped.add(normalisePath(relativePath));
    }
  }
  return scoped;
}

function configFinding(message: string): Finding {
  return {
    id: "configuration.invalid-steward-config",
    rule: "invalid-steward-config",
    category: "configuration",
    severity: "high",
    message: `Invalid .steward.json: ${message}`,
    path: ".steward.json",
    fixable: false,
    confidence: "high",
    remediation: "Repair .steward.json or remove it to return to the built-in defaults."
  };
}

export async function scanRepository(inputRoot: string): Promise<ScanResult> {
  const start = performance.now();
  const root = resolve(inputRoot);
  const loaded = await loadConfig(root);
  const config = loaded.config;
  const git = gitFacts(root);
  const files = await collectFiles(root, config);
  const scopedTracked = scopedTrackedFiles(root, git.root, git.trackedFiles);
  const context: ScanContext = { root, config, files, trackedFiles: scopedTracked, git: { ...git, trackedFiles: scopedTracked } };
  const findings: Finding[] = [];

  if (loaded.warning) findings.push(configFinding(loaded.warning));

  for (const rule of enabledRules(config.rules.disabled)) {
    try {
      findings.push(...rule.run(context));
    } catch (error) {
      findings.push({
        id: `internal.rule-failure.${rule.id}`,
        rule: "rule-execution-failure",
        category: "configuration",
        severity: "high",
        message: `Rule ${rule.id} failed during scanning.`,
        fixable: false,
        confidence: "high",
        details: error instanceof Error ? error.message : "Unknown rule error.",
        remediation: "Investigate the rule failure before relying on the scan as complete."
      });
    }
  }

  findings.sort((a, b) =>
    (SEVERITY_ORDER.get(a.severity) ?? 99) - (SEVERITY_ORDER.get(b.severity) ?? 99) ||
    (a.path ?? "").localeCompare(b.path ?? "") ||
    a.id.localeCompare(b.id)
  );

  return {
    version: 1,
    root,
    scannedFiles: files.length,
    textFiles: files.filter((file) => file.isText).length,
    findings,
    healthScore: scoreFindings(findings),
    durationMs: Math.max(0, Math.round(performance.now() - start)),
    git: context.git,
    categoryCounts: categoryCounts(findings),
    ruleCounts: ruleCounts(findings)
  };
}
