import type { ScanDelta } from "./delta.js";
import type { Finding, ScanResult, Severity } from "./types.js";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

export interface ForgeEvidenceFinding {
  id: string;
  rule: string;
  category: Finding["category"];
  severity: Severity;
  path?: string;
  line?: number;
  fingerprint?: string;
}

export interface ForgeEvidence {
  schemaVersion: 1;
  evidenceType: "repository-health";
  producer: {
    name: "gODtECH Steward";
    resultSchemaVersion: 1;
    version: "0.1.0";
  };
  observedAt: string;
  repository: {
    root: string;
    branch?: string;
    commit?: string;
    dirty?: boolean;
  };
  observation: {
    scannedFiles: number;
    textFiles: number;
    healthScore: number;
    findingCount: number;
    severityCounts: Record<Severity, number>;
    categoryCounts: ScanResult["categoryCounts"];
    rulePacks: ScanResult["rulePacks"];
    findings: ForgeEvidenceFinding[];
  };
  continuousIntegration: {
    command: "steward scan --ci";
    failOn: Severity;
    outcome: "passed" | "failed";
  };
  delta?: ScanDelta;
  limitations: string[];
}

function severityCounts(findings: readonly Finding[]): Record<Severity, number> {
  return SEVERITIES.reduce((result, severity) => {
    result[severity] = findings.filter((finding) => finding.severity === severity).length;
    return result;
  }, {} as Record<Severity, number>);
}

function safeFinding(finding: Finding): ForgeEvidenceFinding {
  return {
    id: finding.id,
    rule: finding.rule,
    category: finding.category,
    severity: finding.severity,
    ...(finding.path ? { path: finding.path } : {}),
    ...(finding.line ? { line: finding.line } : {}),
    ...(finding.fingerprint ? { fingerprint: finding.fingerprint } : {}),
  };
}

export function toForgeEvidence(
  result: ScanResult,
  failOn: Severity,
  scanDelta?: ScanDelta,
  observedAt = new Date().toISOString(),
): ForgeEvidence {
  const limit = SEVERITIES.indexOf(failOn);
  const ciFailed = result.findings.some((finding) => SEVERITIES.indexOf(finding.severity) <= limit);

  return {
    schemaVersion: 1,
    evidenceType: "repository-health",
    producer: {
      name: "gODtECH Steward",
      resultSchemaVersion: 1,
      version: "0.1.0",
    },
    observedAt,
    repository: {
      root: result.root,
      ...(result.git.branch ? { branch: result.git.branch } : {}),
      ...(result.git.commit ? { commit: result.git.commit } : {}),
      ...(result.git.dirty !== undefined ? { dirty: result.git.dirty } : {}),
    },
    observation: {
      scannedFiles: result.scannedFiles,
      textFiles: result.textFiles,
      healthScore: result.healthScore,
      findingCount: result.findings.length,
      severityCounts: severityCounts(result.findings),
      categoryCounts: result.categoryCounts,
      rulePacks: result.rulePacks,
      findings: result.findings.map(safeFinding),
    },
    continuousIntegration: {
      command: "steward scan --ci",
      failOn,
      outcome: ciFailed ? "failed" : "passed",
    },
    ...(scanDelta ? { delta: scanDelta } : {}),
    limitations: [
      "This artifact records observed Steward repository-health data; it is not a FORGE benchmark result.",
      "Source-file contents and detected secret values are intentionally omitted.",
      "Health score and rule findings are Steward observations and must not be presented as provider billing or productivity claims.",
    ],
  };
}

export function toForgeEvidenceJson(
  result: ScanResult,
  failOn: Severity,
  scanDelta?: ScanDelta,
  observedAt?: string,
): string {
  return JSON.stringify(toForgeEvidence(result, failOn, scanDelta, observedAt), null, 2);
}
