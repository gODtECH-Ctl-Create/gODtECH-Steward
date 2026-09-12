import type { Finding, Severity } from "./types.js";

const DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  high: 12,
  medium: 6,
  low: 2,
  info: 0
};

export function scoreFindings(findings: Finding[]): number {
  const ruleTotals = new Map<string, number>();
  for (const finding of findings) {
    const current = ruleTotals.get(finding.rule) ?? 0;
    ruleTotals.set(finding.rule, current + DEDUCTIONS[finding.severity]);
  }
  const deduction = [...ruleTotals.values()].reduce((sum, value) => sum + Math.min(value, 25), 0);
  return Math.max(0, Math.round(100 - Math.min(100, deduction)));
}
