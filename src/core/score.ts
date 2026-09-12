import type { Finding, Severity } from "./types.js";

const PENALTIES: Record<Severity, number> = {
  critical: 35,
  high: 20,
  medium: 8,
  low: 2,
  info: 0
};

export function scoreFindings(findings: readonly Finding[]): number {
  const penalty = findings.reduce((total, finding) => total + PENALTIES[finding.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
