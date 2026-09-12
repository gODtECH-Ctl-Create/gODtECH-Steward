const SEVERITIES = ["critical", "high", "medium", "low", "info"];
function severityCounts(findings) {
  return SEVERITIES.reduce((result, severity) => {
    result[severity] = findings.filter((finding) => finding.severity === severity).length;
    return result;
  }, {});
}
function safeFinding(finding) {
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
export function toForgeEvidence(result, failOn, scanDelta, observedAt = new Date().toISOString()) {
  const limit = SEVERITIES.indexOf(failOn);
  const ciFailed = result.findings.some((finding) => SEVERITIES.indexOf(finding.severity) <= limit);
  return {
    schemaVersion: 1,
    evidenceType: "repository-health",
    producer: { name: "gODtECH Steward", resultSchemaVersion: 1, version: "0.1.0" },
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
export function toForgeEvidenceJson(result, failOn, scanDelta, observedAt) {
  return JSON.stringify(toForgeEvidence(result, failOn, scanDelta, observedAt), null, 2);
}
