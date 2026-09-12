const ORDER = ["critical", "high", "medium", "low", "info"];
function countBySeverity(findings) { return ORDER.reduce((result, severity) => { result[severity] = findings.filter(f => f.severity === severity).length; return result; }, {}); }
export function toJson(result) { return JSON.stringify(result, null, 2); }
export function toText(result) { const counts = countBySeverity(result.findings); const lines = [`gODtECH Steward  Health ${result.healthScore}/100`, `${result.scannedFiles} files scanned, ${result.textFiles} text files, ${result.durationMs}ms`, ""]; if (result.findings.length === 0) {
    lines.push("No findings. Repository is clean against the current rule set.");
    return lines.join("\n");
} lines.push(`Findings: ${result.findings.length}  Critical ${counts.critical}  High ${counts.high}  Medium ${counts.medium}  Low ${counts.low}`); lines.push(""); for (const finding of result.findings) {
    const location = finding.path ? `${finding.path}${finding.line ? `:${finding.line}` : ""}` : "repository";
    lines.push(`[${finding.severity.toUpperCase()}] ${location} - ${finding.message}${finding.fixable ? " [safe-fix]" : ""}`);
} return lines.join("\n"); }
export function hasCiFailure(result, failOn) { const limit = ORDER.indexOf(failOn); return result.findings.some(f => ORDER.indexOf(f.severity) <= limit); }
