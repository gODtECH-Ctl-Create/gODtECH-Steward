import type { FileEntry, Finding } from "../core/types.js";

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "private key", regex: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { name: "GitHub token", regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/ },
  { name: "GitHub fine-grained token", regex: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { name: "Stripe secret key", regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ }
];

function isEnvFile(path: string): boolean {
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  return name === ".env" || (name.startsWith(".env.") && !name.endsWith(".example") && !name.endsWith(".template"));
}

export function securityFindings(files: FileEntry[], tracked: ReadonlySet<string>): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (isEnvFile(file.relPath) && tracked.has(file.relPath)) {
      findings.push({ id: "security.tracked-env-file", rule: "tracked-env-file", category: "security", severity: "critical", message: "An environment file appears to be tracked by Git.", path: file.relPath, fixable: false });
    }
    if (!file.isText || file.content === undefined) continue;
    for (const pattern of SECRET_PATTERNS) {
      const match = pattern.regex.exec(file.content);
      if (match === null) continue;
      const line = file.content.slice(0, match.index).split(/\r?\n/).length;
      findings.push({ id: `security.possible-secret.${pattern.name.replaceAll(" ", "-")}`, rule: "possible-secret", category: "security", severity: "critical", message: `Possible ${pattern.name} detected.`, path: file.relPath, line, fixable: false });
    }
  }
  return findings;
}
