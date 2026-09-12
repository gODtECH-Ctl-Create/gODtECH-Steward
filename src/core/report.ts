import type { Category, Finding, ScanResult, Severity } from "./types.js";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const CATEGORIES: Category[] = ["repository", "security", "documentation", "dependencies", "git", "configuration", "code"];

function countBySeverity(findings: readonly Finding[]): Record<Severity, number> {
  return SEVERITIES.reduce((result, severity) => {
    result[severity] = findings.filter((finding) => finding.severity === severity).length;
    return result;
  }, {} as Record<Severity, number>);
}

export function toJson(result: ScanResult): string {
  return JSON.stringify({ ...result, generatedAt: new Date().toISOString() }, null, 2);
}

export function toText(result: ScanResult): string {
  const severity = countBySeverity(result.findings);
  const lines = [
    `gODtECH Steward`,
    `Health ${result.healthScore}/100`,
    `${result.scannedFiles} files scanned | ${result.textFiles} text files | ${result.durationMs}ms`,
    result.git.isRepository
      ? `Git ${result.git.branch ?? "detached"} @ ${(result.git.commit ?? "unknown").slice(0, 8)}${result.git.dirty ? " | dirty" : ""}`
      : "Git repository: not detected",
    ""
  ];

  if (result.findings.length === 0) {
    lines.push("No findings. Repository is clean against the enabled rule set.");
    return lines.join("\n");
  }

  lines.push(`Findings: ${result.findings.length}`);
  lines.push(`Critical ${severity.critical} | High ${severity.high} | Medium ${severity.medium} | Low ${severity.low} | Info ${severity.info}`);
  lines.push("");

  for (const finding of result.findings) {
    const location = finding.path ? `${finding.path}${finding.line ? `:${finding.line}` : ""}` : "repository";
    const fix = finding.fixable ? " | SAFE FIX" : "";
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.rule} | ${location} | ${finding.message}${fix}`);
    if (finding.remediation) lines.push(`  -> ${finding.remediation}`);
  }
  return lines.join("\n");
}

export function formatSummary(result: ScanResult): string {
  const byCategory = CATEGORIES
    .filter((category) => (result.categoryCounts[category] ?? 0) > 0)
    .map((category) => `${category}:${result.categoryCounts[category]}`)
    .join(" | ");
  return `Health ${result.healthScore}/100 | ${result.findings.length} findings${byCategory ? ` | ${byCategory}` : ""}`;
}

export function hasCiFailure(result: ScanResult, failOn: Severity): boolean {
  const limit = SEVERITIES.indexOf(failOn);
  return result.findings.some((finding) => SEVERITIES.indexOf(finding.severity) <= limit);
}
