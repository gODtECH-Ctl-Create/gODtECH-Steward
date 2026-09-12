const SECRET_PATTERNS = [
    { key: "private-key", name: "private key", regex: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
    { key: "github-token", name: "GitHub token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
    { key: "github-pat", name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
    { key: "aws-access-key", name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
    { key: "slack-token", name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
    { key: "stripe-secret-key", name: "Stripe secret key", regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ }
];
function isEnvFile(path) { const name = path.split("/").at(-1)?.toLowerCase() ?? ""; return name === ".env" || (name.startsWith(".env.") && !name.endsWith(".example") && !name.endsWith(".template")); }
function lineNumber(text, index) { return text.slice(0, index).split(/\r?\n/).length; }
export const securityRule = { id: "security", category: "security", description: "Detects high-confidence tracked environment files and known credential patterns.", run(context) { const findings = []; for (const file of context.files) { if (isEnvFile(file.relPath) && context.trackedFiles.has(file.relPath)) findings.push({ id: "security.tracked-env-file", rule: "tracked-env-file", category: "security", severity: "critical", message: "An environment file appears to be tracked by Git.", path: file.relPath, fixable: false, confidence: "high", remediation: "Remove the file from version control, rotate any exposed credentials, and keep environment files ignored." }); if (!file.isText || file.content === undefined) continue; for (const pattern of SECRET_PATTERNS) { pattern.regex.lastIndex = 0; const match = pattern.regex.exec(file.content); if (!match) continue; findings.push({ id: `security.possible-secret.${pattern.key}`, rule: "possible-secret", category: "security", severity: "critical", message: `Possible ${pattern.name} detected.`, path: file.relPath, line: lineNumber(file.content, match.index), fixable: false, confidence: "high", remediation: "Treat the value as compromised until proven otherwise and rotate it outside source control." }); } } return findings; } };
