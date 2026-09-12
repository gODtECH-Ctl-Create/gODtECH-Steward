import { createHash } from "node:crypto";
const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const CATEGORIES = ["repository", "security", "documentation", "dependencies", "git", "configuration", "code"];
export function findingFingerprint(finding) {
  return createHash("sha256")
    .update(`${finding.id}\u0000${finding.rule}\u0000${finding.path ?? ""}`)
    .digest("hex");
}
function findingReference(finding) {
  return {
    fingerprint: findingFingerprint(finding),
    id: finding.id,
    rule: finding.rule,
    ...(finding.path ? { path: finding.path } : {}),
    ...(finding.line ? { line: finding.line } : {}),
  };
}
function byFingerprint(findings) {
  return new Map(findings.map((finding) => [findingFingerprint(finding), finding]));
}
function countBySeverity(findings) {
  return SEVERITIES.reduce((counts, severity) => {
    counts[severity] = findings.filter((finding) => finding.severity === severity).length;
    return counts;
  }, {});
}
function countByCategory(findings) {
  return findings.reduce((counts, finding) => {
    counts[finding.category] = (counts[finding.category] ?? 0) + 1;
    return counts;
  }, {});
}
function delta(previous, current) {
  return { previous, current, delta: current - previous };
}
function direction(previous, current) {
  if (current > previous) return "improved";
  if (current < previous) return "regressed";
  return "unchanged";
}
export function calculateScanDelta(previous, current) {
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
  }, {});
  const previousCategories = countByCategory(previous.findings);
  const currentCategories = countByCategory(current.findings);
  const categoryCounts = CATEGORIES.reduce((counts, category) => {
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
export function isScanResult(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  return candidate.version === 1 && Array.isArray(candidate.findings) && typeof candidate.healthScore === "number";
}
