import { createHash } from "node:crypto";
import type { Category, Finding, ScanResult, Severity } from "./types.js";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const CATEGORIES: Category[] = ["repository", "security", "documentation", "dependencies", "git", "configuration", "code"];

export interface FindingFingerprint {
  fingerprint: string;
  id: string;
  rule: string;
  path?: string;
  line?: number;
}

export interface CountDelta {
  previous: number;
  current: number;
  delta: number;
}

export interface ScanDelta {
  health: CountDelta & { direction: "improved" | "regressed" | "unchanged" };
  findings: {
    previous: number;
    current: number;
    added: number;
    resolved: number;
    unchanged: number;
    addedItems: FindingFingerprint[];
    resolvedItems: FindingFingerprint[];
  };
  severityCounts: Record<Severity, CountDelta>;
  categoryCounts: Partial<Record<Category, CountDelta>>;
}

export function findingFingerprint(finding: Finding): string {
  return createHash("sha256")
    .update(`${finding.id}\u0000${finding.rule}\u0000${finding.path ?? ""}`)
    .digest("hex");
}

function findingReference(finding: Finding): FindingFingerprint {
  return {
    fingerprint: findingFingerprint(finding),
    id: finding.id,
    rule: finding.rule,
    ...(finding.path ? { path: finding.path } : {}),
    ...(finding.line ? { line: finding.line } : {}),
  };
}

function byFingerprint(findings: readonly Finding[]): Map<string, Finding> {
  return new Map(findings.map((finding) => [findingFingerprint(finding), finding]));
}

function countBySeverity(findings: readonly Finding[]): Record<Severity, number> {
  return SEVERITIES.reduce((counts, severity) => {
    counts[severity] = findings.filter((finding) => finding.severity === severity).length;
    return counts;
  }, {} as Record<Severity, number>);
}

function countByCategory(findings: readonly Finding[]): Partial<Record<Category, number>> {
  return findings.reduce<Partial<Record<Category, number>>>((counts, finding) => {
    counts[finding.category] = (counts[finding.category] ?? 0) + 1;
    return counts;
  }, {});
}

function delta(previous: number, current: number): CountDelta {
  return { previous, current, delta: current - previous };
}

function direction(previous: number, current: number): "improved" | "regressed" | "unchanged" {
  if (current > previous) return "improved";
  if (current < previous) return "regressed";
  return "unchanged";
}

export function calculateScanDelta(previous: ScanResult, current: ScanResult): ScanDelta {
  const previousFindings = byFingerprint(previous.findings);
  const currentFindings = byFingerprint(current.findings);
  const addedItems = [...currentFindings.entries()]
    .filter(([fingerprint]) => !previousFindings.has(fingerprint))
    .map(([, finding]) => findingReference(finding))
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  const resolvedItems = [...previousFindings.entries()]
    .filter(([fingerprint]) => !currentFindings.has(fingerprint))
    .map(([, finding]) => findingReference(finding))
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

  const previousSeverity = countBySeverity(previous.findings);
  const currentSeverity = countBySeverity(current.findings);
  const severityCounts = SEVERITIES.reduce((counts, severity) => {
    counts[severity] = delta(previousSeverity[severity], currentSeverity[severity]);
    return counts;
  }, {} as Record<Severity, CountDelta>);

  const previousCategories = countByCategory(previous.findings);
  const currentCategories = countByCategory(current.findings);
  const categoryCounts = CATEGORIES.reduce<Partial<Record<Category, CountDelta>>>((counts, category) => {
    const before = previousCategories[category] ?? 0;
    const after = currentCategories[category] ?? 0;
    if (before !== 0 || after !== 0) counts[category] = delta(before, after);
    return counts;
  }, {});

  return {
    health: {
      ...delta(previous.healthScore, current.healthScore),
      direction: direction(previous.healthScore, current.healthScore),
    },
    findings: {
      previous: previous.findings.length,
      current: current.findings.length,
      added: addedItems.length,
      resolved: resolvedItems.length,
      unchanged: currentFindings.size - addedItems.length,
      addedItems,
      resolvedItems,
    },
    severityCounts,
    categoryCounts,
  };
}

export function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScanResult>;
  return candidate.version === 1 && Array.isArray(candidate.findings) && typeof candidate.healthScore === "number";
}
